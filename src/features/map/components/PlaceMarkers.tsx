'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { logger } from '@/lib/log';
import { meok, lightPalette , fontSize } from '@/design-system/tokens';
import { escapeHtml, safeImageUrl } from '@/features/map/utils/formatters';
import { mapIconSvg, type MapIconName } from '@/features/map/utils/mapIconSvg';
import { calculateTravelEstimate, isTraditionalPlace, shortRegionName } from '@/features/map/utils/geo';
import { useMapStore } from '../hooks/useMapStore';
import { useStampStore } from '@/features/stamp/hooks/useStampStore';
import type { Item, PlaceCategory } from '../types';

const log = logger('map');

/** 확대/축소 단계 정의 */
const LABEL_MAX_LEVEL = 5; // 레벨 1~5: 선명한 이름표 포함 핀 마커 상시 노출
const PIN_MAX_LEVEL = 6; // 레벨 6: 깔끔한 원형 아이콘 뱃지 핀 (단일 근거리)
// 레벨 7+: 광역 스마트 클러스터 뱃지 (축소 시 뭉침/겹침 완전 방지)

/**
 * 한 화면에 올리는 핀 개수 상한.
 *
 * 이름표 핀은 장소명 전체를 한 줄로 달아 폭이 넓다. 레벨 6은 축척 500m라
 * 화면에 몇 km가 들어오는데, 여기에 120개를 그리면 이름표가 서로 포개져 뭉갠다.
 * 배지 핀(34px 원)은 겹쳐도 읽히므로 상한을 더 준다.
 */
const LABEL_PIN_LIMIT = 60;
const BADGE_PIN_LIMIT = 40;

/** 카테고리별 지도 마커 아이콘. 상단 카테고리 칩셋과 같은 lucide 아이콘을 쓴다. */
const CATEGORY_ICONS: Record<PlaceCategory, MapIconName> = {
  spot: 'landmark',
  culture: 'bookOpen',
  stay: 'home',
  food: 'utensils',
  cafe: 'coffee',
  experience: 'sparkles',
  festival: 'calendar',
  market: 'shoppingBag',
};

export function renderCategoryIconSvg(category: PlaceCategory, size = 15): string {
  return mapIconSvg(CATEGORY_ICONS[category] ?? 'landmark', size);
}

/** 각 카테고리별 고대비 선명 컬러 및 둥근 React SVG 아이콘 */
export const CATEGORY_STYLES: Record<
  PlaceCategory,
  {
    main: string;
    lightBg: string;
    lightBorder: string;
    border: string;
    iconSvg: string;
  }
> = {
  // 1. spot (고택·명소): 청화 코발트
  spot: {
    main: '#2F68FF',
    lightBg: 'rgba(47, 104, 255, 0.12)',
    lightBorder: 'rgba(47, 104, 255, 0.28)',
    border: '#2F68FF',
    iconSvg: renderCategoryIconSvg('spot', 14),
  },
  // 2. culture (문화재·서원): 짙은 코발트 블루
  culture: {
    main: '#1748CF',
    lightBg: 'rgba(23, 72, 207, 0.12)',
    lightBorder: 'rgba(23, 72, 207, 0.28)',
    border: '#1748CF',
    iconSvg: renderCategoryIconSvg('culture', 14),
  },
  // 3. stay (한옥숙소): 단청 주홍
  stay: {
    main: '#FF5414',
    lightBg: 'rgba(255, 84, 20, 0.12)',
    lightBorder: 'rgba(255, 84, 20, 0.28)',
    border: '#FF5414',
    iconSvg: renderCategoryIconSvg('stay', 14),
  },
  // 4. food (향토음식): 먹빛 주홍
  food: {
    main: '#D93600',
    lightBg: 'rgba(217, 54, 0, 0.12)',
    lightBorder: 'rgba(217, 54, 0, 0.28)',
    border: '#D93600',
    iconSvg: renderCategoryIconSvg('food', 14),
  },
  // 5. cafe (한옥카페·디저트): 대청 청록
  cafe: {
    main: '#00B882',
    lightBg: 'rgba(0, 184, 130, 0.12)',
    lightBorder: 'rgba(0, 184, 130, 0.28)',
    border: '#00B882',
    iconSvg: renderCategoryIconSvg('cafe', 14),
  },
  // 6. experience (한복·전통체험): 연지 장미
  experience: {
    main: '#FF2A6D',
    lightBg: 'rgba(255, 42, 109, 0.12)',
    lightBorder: 'rgba(255, 42, 109, 0.28)',
    border: '#FF2A6D',
    iconSvg: renderCategoryIconSvg('experience', 14),
  },
  // 7. festival (야행·축제): 야행 보라
  festival: {
    main: '#673AB7',
    lightBg: 'rgba(103, 58, 183, 0.12)',
    lightBorder: 'rgba(103, 58, 183, 0.28)',
    border: '#673AB7',
    iconSvg: renderCategoryIconSvg('festival', 14),
  },
  // 8. market (전통시장): 청록 그린
  market: {
    main: '#00825B',
    lightBg: 'rgba(0, 130, 91, 0.12)',
    lightBorder: 'rgba(0, 130, 91, 0.28)',
    border: '#00825B',
    iconSvg: renderCategoryIconSvg('market', 14),
  },
};

const styles = css`
  /* ------------------------------------------------------------
   * 1. 핀 공통 키프레임 & 마이크로 인터랙션
   * ------------------------------------------------------------ */
  @keyframes om-pin-spring {
    0% { transform: translateY(-2px) scale(1); }
    35% { transform: translateY(-16px) scale(1.22); }
    65% { transform: translateY(-3px) scale(0.95); }
    100% { transform: translateY(-6px) scale(1.15); }
  }

  @keyframes om-halo-pulse {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
  }

  @keyframes om-eq-wave {
    0%, 100% { height: 3px; }
    50% { height: 10px; }
  }

  /* 정통 한옥 마커 전용: 그림자 연동 둥실 float
     ↑ 위로 올라갈수록 그림자가 흐릿해지고 작아짐 → 물리감 UP */
  /* 클릭 bounce: 스프링감 있게 한번 점프 후 안착 */
  @keyframes om-click-bounce {
    0%   { transform: translateY(-2px) scale(1); }
    25%  { transform: translateY(-14px) scale(1.18); }
    55%  { transform: translateY(-1px) scale(0.96); }
    75%  { transform: translateY(-8px) scale(1.08); }
    100% { transform: translateY(-6px) scale(1.15); }
  }

  /* 2. 상세 확대 시: 이름표 포함 핀 마커 (고대비 플로팅 뱃지) */
  .om-pin {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 3px 12px 3px 4.5px;
    border-radius: 9999px;
    background: #ffffff;
    border: 1.5px solid rgba(25, 31, 40, 0.12);
    box-shadow: 0 4px 16px -2px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.1);
    font-size: ${fontSize.xs};
    font-weight: 700;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.15s ease, color 0.15s ease;
    user-select: none;
  }

  .om-pin:hover,
  .om-pin[data-hovered='true'] {
    transform: translateY(-10px) scale(1.12);
    box-shadow: 0 12px 28px -2px rgba(25, 31, 40, 0.32);
    z-index: 100 !important;
    animation: none !important; /* float 중단 후 hover 상태 고정 */
  }

  .om-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 8px;
    height: 8px;
    background: #ffffff;
    border-right: 1.5px solid rgba(25, 31, 40, 0.12);
    border-bottom: 1.5px solid rgba(25, 31, 40, 0.12);
    transform: translate(-50%, -4px) rotate(45deg);
  }

  .om-pin-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  /* 라이브 사운드 이퀄라이저 바 */
  .om-pin-eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 1.5px;
    height: 10px;
    margin-left: 2px;
  }

  .om-pin-eq span {
    width: 2px;
    background: ${lightPalette.jangmi[500]};
    border-radius: 1px;
    animation: om-eq-wave 0.8s ease-in-out infinite alternate;
  }
  .om-pin-eq span:nth-of-type(2) { animation-delay: 0.25s; }
  .om-pin-eq span:nth-of-type(3) { animation-delay: 0.5s; }

  /* 핀 호버 시 팝업되는 라이브 미니 프리뷰 카드 */
  .om-pin-hover-card {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translate(-50%, 6px) scale(0.9);
    width: max-content;
    min-width: 220px;
    max-width: 275px;
    padding: 10px 12px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 12px 32px -4px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.08);
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-sizing: border-box;
  }

  [data-theme='dark'] .om-pin-hover-card {
    background: #24211c;
    border: 1px solid rgba(255, 255, 255, 0.09);
    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .om-pin:hover .om-pin-hover-card,
  .om-pin[data-hovered='true'] .om-pin-hover-card,
  .om-badge-pin:hover .om-pin-hover-card,
  .om-badge-pin[data-hovered='true'] .om-pin-hover-card {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  .om-pin-hover-thumb {
    width: 100%;
    height: 90px;
    border-radius: 9px;
    object-fit: cover;
    background: #f0eae0;
  }

  .om-pin-hover-title {
    font-family: var(--font-traditional);
    font-size: 14px;
    font-weight: 700;
    color: ${meok[900]};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    line-height: 1.35;
  }

  [data-theme='dark'] .om-pin-hover-title {
    color: #ffffff;
  }

  .om-pin-hover-meta {
    font-family: var(--font-traditional-body);
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: ${meok[500]};
    white-space: nowrap;
    line-height: 1.4;
  }

  .om-pin-hover-cat {
    flex-shrink: 0;
  }

  .om-pin-hover-sep {
    color: ${meok[400]};
    flex-shrink: 0;
    margin: 0 1px;
  }

  .om-pin-hover-dist {
    flex-shrink: 0;
    color: ${meok[500]};
    white-space: nowrap;
  }

  [data-theme='dark'] .om-pin-hover-meta {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-pin-hover-sep {
    color: rgba(255, 255, 255, 0.25);
  }

  [data-theme='dark'] .om-pin-hover-dist {
    color: ${meok[400]};
  }

  /* 마커 클릭 시 방사형 파동 효과 (Ripple Wave) */
  @keyframes om-ripple-expand {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0.85;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.8);
      opacity: 0;
    }
  }

  .om-pin-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    pointer-events: none;
    border: 2px solid #d4af37;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, rgba(212, 175, 55, 0) 75%);
    animation: om-ripple-expand 0.55s cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
    z-index: 10;
  }

  /* 선택된 핀 주변 은은한 동심원 Glow Ring */
  @keyframes om-glow-ring {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7), 0 8px 24px -2px rgba(25, 31, 40, 0.45);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(212, 175, 55, 0), 0 10px 28px -2px rgba(25, 31, 40, 0.55);
    }
  }

  /* 수결첩에 기록된 방문 한옥 인장 표식 */
  .om-pin-stamp-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #b91c1c;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(185, 28, 28, 0.4);
    pointer-events: none;
    z-index: 5;
  }

  /* 선택된 핀의 스프링 점프 & 펄스 오라 */
  .om-pin[data-selected='true'],
  .om-pin[data-detail='true'] {
    color: #ffffff !important;
    background: #191F28 !important;
    border-color: #d4af37 !important;
    box-shadow: 0 8px 26px -2px rgba(25, 31, 40, 0.45);
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, om-glow-ring 2.4s ease-in-out infinite !important;
    z-index: 40 !important;
    opacity: 1 !important;
  }

  /*
    정통 한옥 label 핀.

    예전에는 핀 하나가 무한 애니메이션을 여섯 개 돌렸다 — float 하나, 별 다섯.
    그중 셋에는 filter: drop-shadow까지 붙어 있었다. 라벨 핀이 60개면 360개가
    매 프레임 합성되니, 마커가 몰린 화면에서 눈에 띄게 느려졌다.

    그렇다고 표식이 작으면 정통 한옥인지 알아볼 수가 없다. 그래서 나눈다 —
    쉴 때는 '또렷하지만 가만히', 가리키면 '반짝인다'. 움직임은 사용자가 보고 있는
    핀 하나에서만 일어나므로, 마커가 아무리 몰려도 상시 비용은 0이다.
  */

  /* 쉴 때: 또렷한 금빛 테두리와 황금빛 후광으로 정통 한옥임을 선명하게 알린다. */
  .om-pin--traditional {
    border: 2px solid #EAB308 !important;
    box-shadow:
      0 0 0 2.5px #FDE047,
      0 4px 16px rgba(234, 179, 8, 0.45),
      0 2px 6px rgba(0, 0, 0, 0.08) !important;
  }

  .om-pin--traditional::after {
    border-right: 2px solid #EAB308 !important;
    border-bottom: 2px solid #EAB308 !important;
    background: #ffffff !important;
  }

  /* 전통/한옥 식별 칩 (노란색 뱃지) */
  .om-pin-trad-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1.5px 5.5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
    background: #FEF08A;
    color: #854D0E;
    border: 1px solid #FACC15;
    flex-shrink: 0;
  }

  .om-pin--traditional::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 1px;
    width: 14px;
    height: 14px;
    pointer-events: none;
  }

  /*
    다크 모드: 지도 캔버스의 invert(92%) hue-rotate(180deg) 필터로 인해
    단순 노란색을 주면 명도가 역전되어 탁한 검갈색(dark brown)으로 변해 보이지 않게 된다.
    따라서 핀 자체에 역필터(invert(100%) hue-rotate(180deg))를 적용하고 어두운 배경과
    선명한 황금색 테두리를 지정하여 캔버스 필터를 통과한 후에도 화면상에 찬란한 순수 노란색이 온전히 발색되도록 한다.
  */
  [data-theme='dark'] .om-pin--traditional {
    filter: invert(100%) hue-rotate(180deg) brightness(105%) contrast(95%);
    background: #191F28 !important;
    color: #ffffff !important;
    border: 2px solid #FACC15 !important;
    box-shadow:
      0 0 0 2.5px #FDE047,
      0 0 18px rgba(250, 204, 21, 0.85),
      0 6px 18px rgba(0, 0, 0, 0.6) !important;
  }

  [data-theme='dark'] .om-pin--traditional::after {
    background: #191F28 !important;
    border-right: 2px solid #FACC15 !important;
    border-bottom: 2px solid #FACC15 !important;
  }

  [data-theme='dark'] .om-pin--traditional .om-pin-trad-chip {
    background: #FEF08A !important;
    color: #854D0E !important;
    border: 1px solid #FACC15 !important;
    font-weight: 800 !important;
  }

  [data-theme='dark'] .om-pin--traditional::before {
    color: #FACC15 !important;
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.95) !important;
  }

  /* 가리켰을 때만 도는 반짝임. 한 번에 한 핀뿐이라 비용이 없다. */
  @keyframes om-star-twinkle {
    0% { transform: scale(1) rotate(0deg); }
    45% { transform: scale(1.65) rotate(90deg); }
    70% { transform: scale(1.15) rotate(150deg); }
    100% { transform: scale(1.35) rotate(180deg); }
  }

  @keyframes om-star-burst {
    0% { opacity: 0.35; transform: scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.5) rotate(70deg); }
    100% { opacity: 0.95; transform: scale(1.1) rotate(110deg); }
  }

  /*
    별무리.
    쉴 때는 움직이지 않는다. 개수가 늘어도 상시 비용이 0인 이유다.
    가리키면 시차를 두고 차례로 튀어올라, 핀 하나가 살아나는 것처럼 읽힌다.
  */
  .om-pin-stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .om-pin-stars span {
    position: absolute;
    line-height: 1;
    color: #EAB308;
    opacity: 1;
    font-weight: 700;
    text-shadow: 0 0 6px rgba(250, 204, 21, 0.7);
    transform-origin: 50% 50%;
    transition: opacity 0.2s ease;
  }

  [data-theme='dark'] .om-pin-stars span {
    color: #FACC15 !important;
    opacity: 1 !important;
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.95) !important;
  }

  .om-pin--traditional:hover .om-pin-stars span,
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span,
  .om-badge-pin--traditional:hover .om-pin-stars span,
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span {
    animation: om-star-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(2),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(2),
  .om-badge-pin--traditional:hover .om-pin-stars span:nth-child(2),
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(2) {
    animation-delay: 0.07s;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(3),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(3),
  .om-badge-pin--traditional:hover .om-pin-stars span:nth-child(3),
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(3) {
    animation-delay: 0.14s;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(4),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(4) {
    animation-delay: 0.21s;
  }

  .om-pin--traditional:hover,
  .om-pin--traditional[data-hovered='true'] {
    transform: translateY(-10px) scale(1.12);
    box-shadow:
      0 0 0 3px #FDE047,
      0 0 24px rgba(250, 204, 21, 0.95),
      0 14px 28px -6px rgba(25, 31, 40, 0.28) !important;
  }

  .om-pin--traditional:hover::before,
  .om-pin--traditional[data-hovered='true']::before {
    animation: om-star-twinkle 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /*
    ::after는 핀 꼬리 화살표가 쓰고 있다(.om-pin::after).
    여기에 별을 얹으면 hover할 때 꼬리가 사라지므로 건드리지 않는다.
  */

  .om-pin[data-selected='true']::after,
  .om-pin[data-detail='true']::after {
    background: #191F28 !important;
    border-color: #191F28 !important;
  }

  .om-pin[data-selected='true'] .om-pin-icon-box,
  .om-pin[data-detail='true'] .om-pin-icon-box {
    background: #ffffff !important;
    color: #191F28 !important;
  }

  .om-pin[data-dimmed='true'],
  .om-badge-pin[data-dimmed='true'] {
    opacity: 0.35;
    filter: grayscale(30%);
  }

  /* 3. 중간 확대 시: 선명한 원형 아이콘 뱃지 마커 (34px) */
  /* 3. 중간 확대 시: 선명한 원형 아이콘 뱃지 마커 (32px) */
  .om-badge-pin {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.16);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
  }

  .om-badge-icon-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-4px) scale(1.18);
    box-shadow: 0 6px 18px rgba(25, 31, 40, 0.24);
    z-index: 100 !important;
  }

  /* 정통 한옥 뱃지 핀: 깔끔한 황금빛 테두리 단일 링 */
  .om-badge-pin--traditional {
    border: 2px solid #EAB308 !important;
    box-shadow: 0 2px 10px rgba(234, 179, 8, 0.35) !important;
  }

  [data-theme='dark'] .om-badge-pin--traditional {
    background: #191F28 !important;
    border: 2px solid #FACC15 !important;
    box-shadow: 0 2px 12px rgba(250, 204, 21, 0.5) !important;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: translateY(-4px) scale(1.25);
    background: #191F28 !important;
    box-shadow: 0 6px 20px rgba(25, 31, 40, 0.45);
    z-index: 40 !important;
    opacity: 1 !important;
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
  }

  .om-badge-pin[data-selected='true'] .om-badge-icon-inner,
  .om-badge-pin[data-detail='true'] .om-badge-icon-inner {
    background: #ffffff !important;
    border-color: #ffffff !important;
  }

  /* 4. 전국/광역 축소 조망 시: 스마트 클러스터 뱃지 */
  .om-cluster-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px 5px 8px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    border: none;
    box-shadow: 0 6px 18px -2px rgba(25, 31, 40, 0.16), 0 1px 4px rgba(25, 31, 40, 0.08);
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
    white-space: nowrap;
  }

  .om-cluster-pill:hover {
    transform: translate(-50%, -54%) scale(1.12);
    box-shadow: 0 10px 24px -3px rgba(25, 31, 40, 0.22);
    z-index: 40 !important;
  }

  .om-cluster-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
    flex-shrink: 0;
  }

  .om-cluster-region-name {
    font-size: ${fontSize.xs};
    font-weight: 700;
    color: ${meok[900]};
    letter-spacing: -0.2px;
  }

  .om-cluster-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 9999px;
    background: ${lightPalette.cheongrok[500]};
    color: #ffffff;
    font-size: ${fontSize.xs};
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* ------------------------------------------------------------
   * 5. 키보드 포커스
   *
   * 마커는 role="button" tabindex="0"으로 Tab 순회에 들어온다.
   * 지도 위라 배경색이 제각각이라서 흰 테두리를 한 겹 덧대 어디서든 보이게 한다.
   * ------------------------------------------------------------ */
  .om-pin:focus-visible,
  .om-badge-pin:focus-visible,
  .om-cluster-pill:focus-visible {
    outline: 3px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9);
    z-index: 45 !important;
  }

  /* ------------------------------------------------------------
   * 6. 모션 최소화
   *
   * 이퀄라이저 바와 핀 스프링은 계속 도는 애니메이션이라 가장 먼저 꺼야 한다.
   * 상태 표시는 색과 크기가 대신하므로 정보는 잃지 않는다.
   * ------------------------------------------------------------ */
  @media (prefers-reduced-motion: reduce) {
    .om-pin,
    .om-badge-pin,
    .om-cluster-pill,
    .om-pin-hover-card,
    .om-pin--traditional,
    .om-badge-pin--traditional,
    .om-pin--traditional::before,
    .om-pin-stars span {
      transition: none !important;
      animation: none !important;
    }

    .om-pin-eq span {
      animation: none !important;
      height: 6px;
    }

    .om-pin[data-selected='true'],
    .om-pin[data-detail='true'],
    .om-badge-pin[data-selected='true'],
    .om-badge-pin[data-detail='true'] {
      animation: none !important;
      transform: none;
    }
  }
`;

/** 아이템 목록에서 대표 지역/시·군 명칭 추출 */
function extractClusterRegionName(clusterItems: Item[]): string {
  const counts: Record<string, number> = {};

  for (const item of clusterItems) {
    if (!item.addr) continue;

    // 행정 접미사는 끝에서 한 번만 뗀다 (utils/geo). 전역 치환은 "구리시"를 "리"로 만든다.
    const name = shortRegionName(item.addr);
    if (name.length >= 2) counts[name] = (counts[name] || 0) + 1;
  }

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '한옥명소';
}

interface ClusterGroup {
  lat: number;
  lng: number;
  items: Item[];
}

/**
 * 줌 레벨에 맞춘 공간 격자 클러스터링.
 *
 * 축소 시(level >= 7) 너무 뭉개지지 않고 시·군·구 단위로 자연스럽게 묶이도록
 * 레벨별로 정교하게 조절된 공간 셀 크기를 적용한다.
 */
function clusterNearbyItems(items: Item[], level: number): ClusterGroup[] {
  const cellSize =
    level >= 11 ? 0.85 :
    level >= 10 ? 0.45 :
    level >= 9 ? 0.22 :
    level >= 8 ? 0.08 :
    level >= 7 ? 0.04 :
    0.02;
  const grid = new Map<string, Item[]>();

  for (const item of items) {
    const cellX = Math.round(item.lng / cellSize);
    const cellY = Math.round(item.lat / cellSize);
    const key = `${cellX}_${cellY}`;

    const cellItems = grid.get(key) || [];
    cellItems.push(item);
    grid.set(key, cellItems);
  }

  const clusters: ClusterGroup[] = [];
  grid.forEach((cellItems) => {
    let sumLat = 0;
    let sumLng = 0;
    for (const item of cellItems) {
      sumLat += item.lat;
      sumLng += item.lng;
    }
    clusters.push({
      lat: sumLat / cellItems.length,
      lng: sumLng / cellItems.length,
      items: cellItems,
    });
  });

  return clusters;
}

type OverlayRecord = { overlay: any; el: HTMLElement };

export default function PlaceMarkers() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const category = useMapStore((s) => s.category);
  const level = useMapStore((s) => s.level);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const detailId = useMapStore((s) => s.detailId);
  const userLocation = useMapStore((s) => s.userLocation);
  const searchCenter = useMapStore((s) => s.searchCenter);

  // 현재 지도에 올라가 있는 오버레이 인스턴스 및 엘리먼트 맵 (리렌더링 시 DOM 재생성 방지)
  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map());

  // [1] 오버레이 생성 및 지도 배치 (아이템 목록, 카테고리, 모드, 줌 티어가 변경될 때만 실행)
  useEffect(() => {
    if (!map || mode !== 'info' || items.length === 0 || !window.kakao?.maps) {
      // 기존 오버레이 정리
      overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
      overlayMapRef.current.clear();
      return;
    }

    // 기존 오버레이 해제
    overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
    overlayMapRef.current.clear();

    const activeItems =
      category && category !== 'all' && category !== 'bookmark'
        ? items.filter((it) => it.category === category)
        : items;

    if (activeItems.length === 0) return;

    const isCluster = level > PIN_MAX_LEVEL;

    if (isCluster) {
      const clusters = clusterNearbyItems(activeItems, level);

      clusters.forEach((cluster, idx) => {
        const count = cluster.items.length;
        const regionName = extractClusterRegionName(cluster.items);
        const topItem = cluster.items[0];
        const catStyle = CATEGORY_STYLES[topItem.category] || CATEGORY_STYLES.spot;
        const isSingle = count === 1;

        const el = document.createElement('div');
        el.className = 'om-cluster-pill';
        // regionName은 TourAPI 주소에서 온다 — 이스케이프하고 넣는다.
        el.innerHTML = `
          <span class="om-cluster-icon-box" style="background: ${catStyle.lightBg}; color: ${catStyle.main}; border: 1px solid ${catStyle.lightBorder};">
            ${catStyle.iconSvg}
          </span>
          <span class="om-cluster-region-name">${escapeHtml(isSingle ? topItem.name : regionName)}</span>
          ${!isSingle ? `<span class="om-cluster-count-badge" style="background: ${catStyle.main}">${count}</span>` : ''}
        `;

        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', isSingle ? `${topItem.name}. 상세 보기` : `${regionName} 지역 ${count}곳. 확대해서 보기`);

        const handleClick = () => {
          if (isSingle) {
            const store = useMapStore.getState();
            store.setSelectedId(topItem.id);
            store.setDetailId(topItem.id);
            store.map?.panTo(new window.kakao.maps.LatLng(topItem.lat, topItem.lng));
            store.setSheetSnap('full');
          } else {
            const currentLevel = map.getLevel();
            const targetLevel = Math.max(1, currentLevel - 2);
            map.setLevel(targetLevel, { animate: true });
            map.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
          }
        };

        el.addEventListener('click', handleClick);
        el.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
          content: el,
          yAnchor: 0.5,
          zIndex: 10,
        });
        overlay.setMap(map);
        overlayMapRef.current.set(`cluster_${idx}`, { overlay, el });
      });

      return () => {
        overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
        overlayMapRef.current.clear();
      };
    }

    /*
      개별 핀.

      이름표 핀은 폭이 넓어 서로 겹친다. 레벨이 올라갈수록 같은 화면에 더 넓은 지역이
      들어오므로, 라벨을 다는 구간에서는 개수를 줄여 겹침을 막는다.
      (충돌 회피를 정교하게 하려면 화면 좌표가 필요한데, 그건 pan/zoom마다 다시 재야 한다.
       ponytail: 개수 상한으로 갈음한다. 라벨이 여전히 겹치면 그때 좌표 기반 회피로 올린다.)
    */
    const withLabel = level <= LABEL_MAX_LEVEL;
    const maxPins = withLabel ? LABEL_PIN_LIMIT : BADGE_PIN_LIMIT;

    /*
      자르기 전에 화면 안 것만 남긴다.

      예전에는 items를 배열 순서대로 잘랐다. items는 검색 중심 기준 거리순이라,
      확대해서 검색 중심에서 떨어진 곳을 보면 그 화면의 장소들이 상한 밖으로 밀려
      마커가 통째로 사라졌다 — '확대하면 마커가 없어진다'가 이것이다.

      화면 기준으로 고르면 확대할수록 후보가 줄어 상한에 걸릴 일도 함께 사라진다.
    */
    const bounds = map.getBounds?.();
    const visibleItems =
      bounds && window.kakao?.maps
        ? activeItems.filter((it) =>
            bounds.contain(new window.kakao.maps.LatLng(it.lat, it.lng)),
          )
        : activeItems;

    const targetItems = (visibleItems.length > 0 ? visibleItems : activeItems).slice(0, maxPins);

    targetItems.forEach((item) => {
      const el = document.createElement('div');
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.spot;
      /*
        거리·이동시간은 기준점을 밝혀서 적는다.
        예전에는 검색 중심에서 잰 값을 "도보 3분"이라고만 써서, 지도를 옮기면
        사용자에게서 30km 떨어진 곳이 도보 3분으로 보였다.
      */
      const estimate = calculateTravelEstimate(
        { lat: item.lat, lng: item.lng },
        userLocation,
        searchCenter,
      );
      const metaText = estimate.fullLabel;
      const distInfo = estimate.travelTimeStr
        ? `${estimate.distanceStr} · ${estimate.travelTimeStr}`
        : estimate.distanceStr;

      const isTraditional = item.isTraditional ?? isTraditionalPlace(item.name);

      const catLabel = isTraditional
        ? item.category === 'stay'
          ? '정통 한옥숙소'
          : item.category === 'cafe'
            ? '전통 찻집·한옥카페'
            : item.category === 'food'
              ? '향토·전통음식'
              : item.category === 'spot'
                ? '고택·명소'
                : '전통 문화'
        : item.category === 'stay'
          ? '주변 연계숙소'
          : item.category === 'cafe'
            ? '주변 일반카페'
            : item.category === 'food'
              ? '주변 일반음식점'
              : '관광명소';

      /*
        호버 카드는 마우스가 닿을 때 만든다.
        전에는 핀마다 미리 넣어뒀는데, 그러면 화면에 뜨자마자 썸네일 100장이 한꺼번에
        내려온다 (오버레이는 대체로 뷰포트 안이라 loading="lazy"가 걸러주지 못한다).
      */
      const buildHoverCard = () => {
        if (el.querySelector('.om-pin-hover-card')) return;

        const card = document.createElement('div');
        card.className = 'om-pin-hover-card';
        card.innerHTML = `
          ${imgSrc ? `<img src="${imgSrc}" alt="" class="om-pin-hover-thumb" />` : ''}
          <h5 class="om-pin-hover-title">${escapeHtml(item.name)}</h5>
          <div class="om-pin-hover-meta">
            <span class="om-pin-hover-cat" style="color: ${catStyle.main}; font-weight: 700;">${escapeHtml(catLabel)}</span>
            ${distInfo ? `<span class="om-pin-hover-sep">·</span><span class="om-pin-hover-dist">${escapeHtml(distInfo)}</span>` : ''}
          </div>
        `;
        el.appendChild(card);
      };

      const imgSrc = safeImageUrl(item.image);

      if (withLabel) {
        el.className = `om-pin${isTraditional ? ' om-pin--traditional' : ''}`;
        el.style.position = 'relative';
        const tradLabel = item.name.includes('한옥') || item.name.includes('고택') || item.category === 'stay' ? '한옥' : '전통';
        el.innerHTML = `
          <span class="om-pin-icon-box" style="background: ${catStyle.lightBg}; border: 1px solid ${catStyle.lightBorder}; color: ${catStyle.main};">${catStyle.iconSvg}</span>
          ${isTraditional ? `<span class="om-pin-trad-chip">${tradLabel}</span>` : ''}
          <span>${escapeHtml(item.name)}</span>
        `;
        if (isTraditional) {
          /*
            별무리.
            가리키면 시차를 두고 차례로 튀어올라, 핀 하나가 살아나는 것처럼 읽힌다.
            상시 황금빛으로 또렷하게 반짝인다.
          */
          const stars = document.createElement('span');
          stars.className = 'om-pin-stars';
          const starSvg = mapIconSvg('star', 11);
          stars.innerHTML = `
            <span style="top:-16px;left:14px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="top:-9px;left:-6px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="bottom:-13px;right:2px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="bottom:-7px;right:18px;color:#EAB308;display:inline-flex;">${starSvg}</span>
          `;
          el.appendChild(stars);
        }
      } else {
        el.className = `om-badge-pin${isTraditional ? ' om-badge-pin--traditional' : ''}`;
        el.innerHTML = `
          <span class="om-badge-icon-inner" style="background: #ffffff; color: ${catStyle.main};">
            ${renderCategoryIconSvg(item.category, 16)}
          </span>
        `;
      }

      el.dataset.category = item.category;

      /*
        마커는 div라 기본적으로 키보드에 잡히지 않고 스크린리더에도 안 읽힌다.
        버튼 의미를 직접 붙여서 Tab으로 순회하고 Enter/Space로 열 수 있게 한다.
      */
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute(
        'aria-label',
        `${item.name}, ${catLabel}${metaText ? `, ${metaText}` : ''}. 상세 정보 열기`,
      );

      // 수결첩에 기록된 장소인 경우 붉은 인장 표식 부착
      const isVisited = useStampStore.getState().isPlaceVisited(item.id);
      if (isVisited) {
        const badge = document.createElement('span');
        badge.className = 'om-pin-stamp-badge';
        badge.setAttribute('title', '수결첩에 기록된 한옥');
        badge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        el.appendChild(badge);
      }

      const open = () => {
        // 1. 방사형 Ripple 파동 연출 생성
        const ripple = document.createElement('span');
        ripple.className = 'om-pin-ripple';
        el.appendChild(ripple);
        setTimeout(() => {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 580);

        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.setDetailId(item.id);
        store.map?.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        store.setSheetSnap('full');
      };

      el.addEventListener('click', open);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      const handleMouseEnter = () => {
        buildHoverCard();
        overlay.setZIndex(100);
        useMapStore.getState().setHoveredId(item.id);
      };
      const handleMouseLeave = () => {
        const store = useMapStore.getState();
        const isDetail = item.id === store.detailId;
        const isSelected = item.id === store.selectedId;
        overlay.setZIndex(isDetail ? 35 : isSelected ? 30 : 1);
        if (store.hoveredId === item.id) {
          store.setHoveredId(null);
        }
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('focus', handleMouseEnter);
      el.addEventListener('blur', handleMouseLeave);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(item.lat, item.lng),
        content: el,
        yAnchor: 1.0,
        zIndex: 1,
      });
      overlay.setMap(map);
      overlayMapRef.current.set(item.id, { overlay, el });
    });

    return () => {
      overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
      overlayMapRef.current.clear();
    };
    /*
      level을 그대로 의존성에 넣는다.
      예전에는 `level > 8`, `level <= 6` 두 불리언만 넣어서 9→10→11 사이 변화가
      이펙트를 깨우지 못했다 — 클러스터 격자 크기가 처음 값에 얼어붙었다.
    */
  }, [map, mode, items, category, level, userLocation, searchCenter]);

  // [2] 선택/호버/상세보기 상태만 DOM 실시간 업데이트 (오버레이 재생성 0회, 0.1ms 초고속 반영)
  useEffect(() => {
    if (overlayMapRef.current.size === 0) return;

    overlayMapRef.current.forEach((val: OverlayRecord, id: string) => {
      const isDetail = id === detailId;
      const isSelected = id === selectedId || isDetail;
      const isHovered = id === hoveredId;
      const isDimmed = Boolean(detailId && !isDetail);

      val.el.dataset.selected = String(isSelected);
      val.el.dataset.detail = String(isDetail);
      val.el.dataset.hovered = String(isHovered);
      val.el.dataset.dimmed = String(isDimmed);

      const zIndex = isHovered ? 100 : isDetail ? 35 : isSelected ? 30 : 1;
      val.overlay.setZIndex(zIndex);
    });
  }, [selectedId, hoveredId, detailId]);

  return <Global styles={styles} />;
}
