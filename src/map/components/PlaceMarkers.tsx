'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { logger } from '@/lib/log';
import { meok, lightPalette } from '@/design-system/tokens';
import { escapeHtml, safeImageUrl } from '@/map/utils/formatters';
import { calculateTravelEstimate, isTraditionalPlace, shortRegionName } from '@/map/utils/geo';
import { useMapStore } from '../hooks/useMapStore';
import type { Item, PlaceCategory } from '../types';

const log = logger('map');

/** 확대/축소 단계 정의 */
const LABEL_MAX_LEVEL = 6; // 레벨 1~6: 선명한 이름표 포함 핀 마커 상시 노출 (가시성 대폭 향상)
const PIN_MAX_LEVEL = 8; // 레벨 7~8: 고대비 원형 아이콘 뱃지 핀
// 레벨 9~11: 광역 지역별 스마트 클러스터 뱃지

/**
 * 한 화면에 올리는 핀 개수 상한.
 *
 * 이름표 핀은 장소명 전체를 한 줄로 달아 폭이 넓다. 레벨 6은 축척 500m라
 * 화면에 몇 km가 들어오는데, 여기에 120개를 그리면 이름표가 서로 포개져 뭉갠다.
 * 배지 핀(34px 원)은 겹쳐도 읽히므로 상한을 더 준다.
 */
const LABEL_PIN_LIMIT = 60;
const BADGE_PIN_LIMIT = 120;

/** 각 카테고리별 고대비 선명 컬러 및 React SVG 아이콘 */
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
  // 1. spot (고택·명소): 기와(청화 코발트) + 기둥·마루(황금 기와) + 기단(단청 주홍) 3중 컬러
  spot: {
    main: '#2F68FF',
    lightBg: 'rgba(47, 104, 255, 0.1)',
    lightBorder: 'rgba(47, 104, 255, 0.25)',
    border: '#2F68FF',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L21.5 8C20 8.5 17.5 9 12 9C6.5 9 4 8.5 2.5 8L12 2.5Z" fill="#2F68FF"/><path d="M12 2.5L22 8L20 9.5C16 9 13.5 9 12 9C10.5 9 8 9 4 9.5L2 8L12 2.5Z" stroke="#1748CF" stroke-width="0.5"/><rect x="4.5" y="9.5" width="15" height="1.8" rx="0.5" fill="#D47F00"/><rect x="5.5" y="11.3" width="2" height="6.7" rx="0.4" fill="#FFA000"/><rect x="11" y="11.3" width="2" height="6.7" rx="0.4" fill="#FFA000"/><rect x="16.5" y="11.3" width="2" height="6.7" rx="0.4" fill="#FFA000"/><rect x="8" y="12" width="2.5" height="5" rx="0.3" fill="#C0F3DF" stroke="#00825B" stroke-width="0.6"/><rect x="13.5" y="12" width="2.5" height="5" rx="0.3" fill="#C0F3DF" stroke="#00825B" stroke-width="0.6"/><rect x="3" y="18" width="18" height="2.5" rx="0.8" fill="#FF5414"/><rect x="2" y="20.5" width="20" height="1.5" rx="0.5" fill="#D93600"/></svg>`,
  },
  // 2. culture (문화재·서원): 서책 표지(청화 코발트) + 내지(황금 기와) + 책갈피(단청 주홍/연지 장미) 3중 컬러
  culture: {
    main: '#1748CF',
    lightBg: 'rgba(47, 104, 255, 0.1)',
    lightBorder: 'rgba(47, 104, 255, 0.25)',
    border: '#1748CF',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.5C3 4.4 3.9 3.5 5 3.5H11V19.5H5C3.9 19.5 3 18.6 3 17.5V5.5Z" fill="#2F68FF"/><path d="M21 5.5C21 4.4 20.1 3.5 19 3.5H13V19.5H19C20.1 19.5 21 18.6 21 17.5V5.5Z" fill="#1748CF"/><path d="M4.5 5C4.5 4.5 5 4 5.5 4H11V18.5H5.5C5 18.5 4.5 18 4.5 17.5V5Z" fill="#FFF0B8"/><path d="M19.5 5C19.5 4.5 19 4 18.5 4H13V18.5H18.5C19 18.5 19.5 18 19.5 17.5V5Z" fill="#FFDE70"/><circle cx="4" cy="6.5" r="0.8" fill="#FF2A6D"/><circle cx="4" cy="9.5" r="0.8" fill="#FF2A6D"/><circle cx="4" cy="13.5" r="0.8" fill="#FF2A6D"/><circle cx="4" cy="16.5" r="0.8" fill="#FF2A6D"/><path d="M12 3V21L14.5 19L17 21V16" fill="#FF5414"/></svg>`,
  },
  // 3. stay (한옥숙소): 처마(단청 주홍) + 꽃살문(대청 청록) + 마루(황금 기와) 3중 컬러
  stay: {
    main: '#FF5414',
    lightBg: 'rgba(255, 84, 20, 0.1)',
    lightBorder: 'rgba(255, 84, 20, 0.25)',
    border: '#FF5414',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 9.5L3.5 11L12 5.5L20.5 11L22 9.5L12 3Z" fill="#D93600"/><path d="M12 4.5L5 9.5H19L12 4.5Z" fill="#FF5414"/><rect x="5" y="9.5" width="14" height="10" fill="#FFF9E6"/><rect x="4.5" y="9.5" width="1.5" height="10.5" fill="#D47F00"/><rect x="18" y="9.5" width="1.5" height="10.5" fill="#D47F00"/><rect x="8.5" y="11.5" width="7" height="8" rx="0.5" fill="#E8FAF3" stroke="#00B882" stroke-width="1"/><line x1="12" y1="11.5" x2="12" y2="19.5" stroke="#00B882" stroke-width="0.8"/><line x1="8.5" y1="15.5" x2="15.5" y2="15.5" stroke="#00B882" stroke-width="0.8"/><rect x="3" y="20" width="18" height="2" rx="0.5" fill="#FFA000"/></svg>`,
  },
  // 4. food (향토음식): 뚝배기(먹빛) + 온기(코발트) + 고명(청록, 황금, 연지) 3중 컬러
  food: {
    main: '#D93600',
    lightBg: 'rgba(217, 54, 0, 0.1)',
    lightBorder: 'rgba(217, 54, 0, 0.25)',
    border: '#D93600',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3.5C7.5 5 8.5 6 7.5 7.5" stroke="#6099FC" stroke-width="1.2" stroke-linecap="round"/><path d="M12 2C11.5 4 12.5 5 11.5 6.5" stroke="#26CF9A" stroke-width="1.4" stroke-linecap="round"/><path d="M16 3.5C15.5 5 16.5 6 15.5 7.5" stroke="#FF7842" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="12" cy="11.5" rx="8.5" ry="2.5" fill="#3E2723"/><path d="M3.5 11.5C3.5 17 6.5 21 12 21C17.5 21 20.5 17 20.5 11.5H3.5Z" fill="#241B18"/><ellipse cx="12" cy="11.5" rx="7.2" ry="1.8" fill="#FF5414"/><circle cx="10" cy="11.5" r="1.3" fill="#00B882"/><circle cx="14" cy="11.5" r="1.3" fill="#FFBC1A"/><circle cx="12" cy="12" r="1.2" fill="#FF2A6D"/><rect x="7" y="21" width="10" height="1.5" rx="0.5" fill="#D47F00"/></svg>`,
  },
  // 5. cafe (한옥카페·디저트): 고려청자 찻잔(대청 청록) + 전통차(황금 기와) + 꽃잎(연지 장미) 3중 컬러
  cafe: {
    main: '#00B882',
    lightBg: 'rgba(0, 184, 130, 0.1)',
    lightBorder: 'rgba(0, 184, 130, 0.25)',
    border: '#00B882',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 3C8 4.5 9 5.5 8.5 7" stroke="#26CF9A" stroke-width="1.2" stroke-linecap="round"/><path d="M12 2.5C11.5 4 12.5 5 12 6.5" stroke="#FF5E8E" stroke-width="1.2" stroke-linecap="round"/><path d="M4 8H17V14C17 17.5 14 19 10.5 19C7 19 4 17.5 4 14V8Z" fill="#00B882"/><path d="M17 9.5H19C20.1 9.5 21 10.4 21 11.5C21 12.6 20.1 13.5 19 13.5H17" stroke="#00825B" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="10.5" cy="8.2" rx="5.8" ry="1.4" fill="#FFBC1A"/><circle cx="11" cy="8.2" r="1" fill="#FF2A6D"/><path d="M3 19.5C3 19.5 6 21.5 11 21.5C16 21.5 19 19.5 19 19.5" stroke="#D47F00" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  // 6. experience (한복·전통체험): 치마(연지 장미) + 저고리(청화 코발트) + 옷고름(황금 기와) 3중 컬러
  experience: {
    main: '#FF2A6D',
    lightBg: 'rgba(255, 42, 109, 0.1)',
    lightBorder: 'rgba(255, 42, 109, 0.25)',
    border: '#FF2A6D',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L12 7.5L17 4L20 8L17 10L15 8.5V11H9V8.5L7 10L4 8L7 4Z" fill="#2F68FF"/><path d="M10.5 6.5L12 7.5L13.5 6.5" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/><path d="M12 8V14L13.5 13.5" stroke="#FFA000" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8.2" r="1" fill="#D47F00"/><path d="M9 11C9 11 7 14 5 21C8 22 16 22 19 21C17 14 15 11 15 11H9Z" fill="#FF2A6D"/><path d="M12 11C11.5 14 11 17.5 10 21.5" stroke="#D40D4E" stroke-width="0.8" opacity="0.6"/><path d="M13.5 11C13.8 14 14.5 17.5 15.5 21.5" stroke="#D40D4E" stroke-width="0.8" opacity="0.6"/><circle cx="19.5" cy="5.5" r="1.5" fill="#FFBC1A"/><circle cx="4.5" cy="18.5" r="1.2" fill="#26CF9A"/></svg>`,
  },
  // 7. festival (야행·축제): 성곽(청화 코발트) + 야행 달빛(황금 기와) + 축제 불꽃(연지 장미) 3중 컬러
  festival: {
    main: '#673AB7',
    lightBg: 'rgba(103, 58, 183, 0.12)',
    lightBorder: 'rgba(103, 58, 183, 0.25)',
    border: '#673AB7',
    iconSvg: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1" viewBox="0 0 48 48" enable-background="new 0 0 48 48" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><polygon fill="#673AB7" points="16.5,18 0,42 33,42"/><polygon fill="#9575CD" points="33.6,24 19.2,42 48,42"/><path fill="#40C4FF" d="M42.9,6.3C43.6,7.4,44,8.6,44,10c0,3.9-3.1,7-7,7c-0.7,0-1.3-0.1-1.9-0.3c1.2,2,3.4,3.3,5.9,3.3 c3.9,0,7-3.1,7-7C48,9.8,45.9,7.1,42.9,6.3z"/></svg>`,
  },
  // 8. market (전통시장): 주홍 + 청록 + 황금 3색 천막 어닝 + 특산품 3중 컬러
  market: {
    main: '#00825B',
    lightBg: 'rgba(0, 130, 91, 0.1)',
    lightBorder: 'rgba(0, 130, 91, 0.25)',
    border: '#00825B',
    iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8L4.5 4H7.5L6.5 8H3Z" fill="#FF5414"/><path d="M6.5 8L7.5 4H10.5L9.5 8H6.5Z" fill="#FFA000"/><path d="M9.5 8L10.5 4H13.5L12.5 8H9.5Z" fill="#00B882"/><path d="M12.5 8L13.5 4H16.5L15.5 8H12.5Z" fill="#2F68FF"/><path d="M15.5 8L16.5 4H19.5L18.5 8H15.5Z" fill="#FF2A6D"/><path d="M18.5 8L19.5 4H21L20.5 8H18.5Z" fill="#FF5414"/><path d="M2.5 8C3.5 9.5 5.5 9.5 6.5 8C7.5 9.5 9.5 9.5 10.5 8C11.5 9.5 13.5 9.5 14.5 8C15.5 9.5 17.5 9.5 18.5 8C19.5 9.5 21 9 21.5 8" stroke="#D47F00" stroke-width="1.2" stroke-linecap="round"/><rect x="4" y="9.5" width="1.5" height="10" fill="#FFA000"/><rect x="18.5" y="9.5" width="1.5" height="10" fill="#FFA000"/><rect x="5.5" y="13" width="13" height="7" rx="0.5" fill="#FFF3EB" stroke="#FF5414" stroke-width="1"/><circle cx="8.5" cy="15.5" r="1.5" fill="#FF2A6D"/><circle cx="12" cy="15.5" r="1.5" fill="#00B882"/><circle cx="15.5" cy="15.5" r="1.5" fill="#FFA000"/><line x1="2" y1="20.5" x2="22" y2="20.5" stroke="#b0b8c1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
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
  @keyframes om-traditional-float {
    0%, 100% {
      transform: translateY(-2px) scale(1);
      box-shadow: 0 8px 20px -2px rgba(25, 31, 40, 0.28), 0 2px 6px rgba(25, 31, 40, 0.12);
    }
    50% {
      transform: translateY(-10px) scale(1.018);
      box-shadow: 0 18px 32px -6px rgba(25, 31, 40, 0.13), 0 4px 8px rgba(25, 31, 40, 0.06);
    }
  }

  /* 정통 한옥 뱃지 마커: 그림자 연동 float */
  @keyframes om-traditional-float-badge {
    0%, 100% {
      transform: translateY(0px) scale(1);
      box-shadow: 0 6px 16px rgba(25, 31, 40, 0.22), 0 2px 4px rgba(25, 31, 40, 0.1);
    }
    50% {
      transform: translateY(-7px) scale(1.03);
      box-shadow: 0 16px 28px rgba(25, 31, 40, 0.11), 0 3px 6px rgba(25, 31, 40, 0.05);
    }
  }

  /* ✦ 황금 별 반짝이 (label pin 전용) */
  @keyframes om-sparkle-star {
    0%, 55%, 100% { opacity: 0; transform: scale(0.4) rotate(-10deg); }
    28% { opacity: 1; transform: scale(1.3) rotate(15deg); }
    42% { opacity: 0.7; transform: scale(1.0) rotate(5deg); }
  }

  /* ◎ 황금 후광 링 (badge pin 전용) — 은은한 shimmer, 심박동 아님 */
  @keyframes om-halo-ring {
    0%, 65%, 100% { opacity: 0; transform: scale(0.92); }
    32% { opacity: 0.42; transform: scale(1.18); }
  }

  /* 공통 별 반짝이 span */
  .om-sparkle {
    position: absolute;
    pointer-events: none;
    color: #d4af37;
    line-height: 1;
    animation: om-sparkle-star ease-in-out infinite;
  }

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
    font-size: 13px;
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
    z-index: 35 !important;
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
    width: 195px;
    padding: 10px;
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
    height: 84px;
    border-radius: 8px;
    object-fit: cover;
    background: #f0eae0;
  }

  .om-pin-hover-title {
    font-size: 13px;
    font-weight: 700;
    color: ${meok[900]};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }

  .om-pin-hover-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: ${meok[500]};
  }

  /* 선택된 핀의 스프링 점프 & 펄스 오라 */
  .om-pin[data-selected='true'],
  .om-pin[data-detail='true'] {
    color: #ffffff !important;
    background: #191F28 !important;
    border-color: #191F28 !important;
    box-shadow: 0 8px 26px -2px rgba(25, 31, 40, 0.45);
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
    z-index: 40 !important;
    opacity: 1 !important;
  }

  /* 정통 한옥 label 핀: 그림자 연동 float + 황금 별 반짝이 */
  .om-pin--traditional {
    animation: om-traditional-float 2.8s ease-in-out infinite;
    animation-delay: var(--float-delay, 0s);
  }

  /* ✦ 황금 별 — 핀 좌상단에 뿅 나타났다 사라지는 스파클 (좌상단 그룹 1번째) */
  .om-pin--traditional::before {
    content: '✦';
    position: absolute;
    top: -13px;
    left: 3px;
    font-size: 13px;
    color: #d4af37;
    line-height: 1;
    pointer-events: none;
    animation: om-sparkle-star 2.6s ease-in-out infinite;
    animation-delay: var(--sparkle-delay, 0.4s);
  }

  .om-pin--traditional:hover,
  .om-pin--traditional[data-hovered='true'] {
    animation: none !important;
    transform: translateY(-10px) scale(1.12);
  }
  .om-pin--traditional:hover::before,
  .om-pin--traditional[data-hovered='true']::before {
    animation: none;
    opacity: 0;
  }

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
  .om-badge-pin {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 4px 16px rgba(25, 31, 40, 0.18), 0 1px 4px rgba(25, 31, 40, 0.1);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
  }

  .om-badge-icon-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-8px) scale(1.3);
    box-shadow: 0 10px 26px rgba(25, 31, 40, 0.32);
    z-index: 35 !important;
    animation: none !important;
  }

  /* 정통 한옥 뱃지 핀: 그림자 연동 float + 황금 후광 링 */
  .om-badge-pin--traditional {
    animation: om-traditional-float-badge 2.6s ease-in-out infinite;
    animation-delay: var(--float-delay, 0s);
  }

  /* ◎ 황금 후광 링 — 마커 주위를 감싸는 골드 링이 주기적으로 나타났다 사라짐 */
  .om-badge-pin--traditional::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px solid rgba(212, 175, 55, 0.65);
    pointer-events: none;
    animation: om-halo-ring 2.8s ease-in-out infinite;
    animation-delay: var(--sparkle-delay, 0.6s);
  }

  .om-badge-pin--traditional:hover,
  .om-badge-pin--traditional[data-hovered='true'] {
    animation: none !important;
    transform: translateY(-8px) scale(1.3);
  }
  .om-badge-pin--traditional:hover::before,
  .om-badge-pin--traditional[data-hovered='true']::before {
    animation: none;
    opacity: 0;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: translateY(-6px) scale(1.35);
    background: #191F28 !important;
    box-shadow: 0 8px 28px rgba(25, 31, 40, 0.45);
    z-index: 40 !important;
    opacity: 1 !important;
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
  }

  .om-badge-pin[data-selected='true'] .om-badge-icon-inner,
  .om-badge-pin[data-detail='true'] .om-badge-icon-inner {
    background: #ffffff !important;
    border-color: #ffffff !important;
  }

  .om-badge-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 7px;
    height: 7px;
    background: #ffffff;
    border-right: 1.5px solid rgba(25, 31, 40, 0.12);
    border-bottom: 1.5px solid rgba(25, 31, 40, 0.12);
    transform: translate(-50%, -4px) rotate(45deg);
  }

  .om-badge-pin[data-selected='true']::after,
  .om-badge-pin[data-detail='true']::after {
    background: #191F28 !important;
    border-right: 1.5px solid #191F28 !important;
    border-bottom: 1.5px solid #191F28 !important;
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
    font-size: 13px;
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
    font-size: 11.5px;
    font-weight: 800;
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
    .om-badge-pin--traditional {
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
 * 클러스터는 level > PIN_MAX_LEVEL(8)에서만 뜨므로 실제로 들어오는 값은 9·10·11이다.
 * 레벨이 한 칸 오를 때마다 축척이 두 배가 되니 셀도 두 배로 키운다.
 */
function clusterNearbyItems(items: Item[], level: number): ClusterGroup[] {
  const cellSize = level >= 11 ? 0.9 : level >= 10 ? 0.55 : 0.32;
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
  const level = useMapStore((s) => s.level);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const detailId = useMapStore((s) => s.detailId);
  const userLocation = useMapStore((s) => s.userLocation);
  const searchCenter = useMapStore((s) => s.searchCenter);

  // 현재 지도에 올라가 있는 오버레이 인스턴스 및 엘리먼트 맵 (리렌더링 시 DOM 재생성 방지)
  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map());

  // [1] 오버레이 생성 및 지도 배치 (아이템 목록, 모드, 줌 티어가 변경될 때만 실행)
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

    const isCluster = level > PIN_MAX_LEVEL;

    if (isCluster) {
      const clusters = clusterNearbyItems(items, level);

      clusters.forEach((cluster, idx) => {
        const count = cluster.items.length;
        const regionName = extractClusterRegionName(cluster.items);
        const topItem = cluster.items[0];
        const catStyle = CATEGORY_STYLES[topItem.category] || CATEGORY_STYLES.spot;

        const el = document.createElement('div');
        el.className = 'om-cluster-pill';
        // regionName은 TourAPI 주소에서 온다 — 이스케이프하고 넣는다.
        el.innerHTML = `
          <span class="om-cluster-icon-box" style="background: ${catStyle.lightBg}; color: ${catStyle.main}">
            ${catStyle.iconSvg}
          </span>
          <span class="om-cluster-region-name">${escapeHtml(regionName)}</span>
          <span class="om-cluster-count-badge" style="background: ${catStyle.main}">
            ${count}
          </span>
        `;

        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `${regionName} 지역 ${count}곳. 확대해서 보기`);

        const zoomIn = () => {
          const currentLevel = map.getLevel();
          const targetLevel = Math.max(1, currentLevel - 3);
          map.setLevel(targetLevel, { animate: true });
          map.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
        };

        el.addEventListener('click', zoomIn);
        el.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            zoomIn();
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
    const targetItems = items.slice(0, maxPins);

    targetItems.forEach((item) => {
      const el = document.createElement('div');
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.spot;
      /*
        거리·이동시간은 기준점을 밝혀서 적는다.
        예전에는 검색 중심에서 잰 값을 "도보 3분"이라고만 써서, 지도를 옮기면
        사용자에게서 30km 떨어진 곳이 도보 3분으로 보였다.
      */
      const metaText = calculateTravelEstimate(
        { lat: item.lat, lng: item.lng },
        userLocation,
        searchCenter,
      ).fullLabel;

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
            <span style="color: ${catStyle.main}; font-weight: 700;">${isTraditional ? '🏛️ ' : ''}${escapeHtml(catLabel)}</span>
            <span>${escapeHtml(metaText)}</span>
          </div>
        `;
        el.appendChild(card);
      };

      const imgSrc = safeImageUrl(item.image);

      if (withLabel) {
        el.className = `om-pin${isTraditional ? ' om-pin--traditional' : ''}`;
        el.style.position = 'relative';
        el.innerHTML = `
          <span class="om-pin-icon-box" style="background: ${catStyle.lightBg}; border: 1px solid ${catStyle.lightBorder};">${catStyle.iconSvg}</span>
          <span>${escapeHtml(item.name)}</span>
        `;
        if (isTraditional) {
          // 마커마다 float와 sparkle 타이밍을 다르게 → 기계적 동조 방지
          const floatDelay = (Math.random() * 2.4).toFixed(2);
          const sparkleDelay = (Math.random() * 2.0 + 0.2).toFixed(2);
          el.style.setProperty('--float-delay', `${floatDelay}s`);
          el.style.setProperty('--sparkle-delay', `${sparkleDelay}s`);
          // 별 반짝이: 좌상단 3개 + 우하단 2개 (북규칙하게 다른 타이밍)
          const s1d = (Math.random() * 1.6 + 0.3).toFixed(2);
          const s2d = (Math.random() * 1.8 + 0.8).toFixed(2);
          const s3d = (Math.random() * 2.0 + 0.5).toFixed(2);
          const s4d = (Math.random() * 1.4 + 1.0).toFixed(2);
          const extra = document.createElement('span');
          extra.innerHTML = `
            <span class="om-sparkle" style="top:-9px;left:18px;font-size:13px;animation-duration:3.0s;animation-delay:${s1d}s;">✧</span>
            <span class="om-sparkle" style="top:-17px;left:10px;font-size:12px;animation-duration:2.4s;animation-delay:${s2d}s;">✦</span>
            <span class="om-sparkle" style="bottom:-13px;right:4px;font-size:15px;animation-duration:2.8s;animation-delay:${s3d}s;">✦</span>
            <span class="om-sparkle" style="bottom:-9px;right:20px;font-size:12px;animation-duration:3.3s;animation-delay:${s4d}s;">✧</span>
          `;
          extra.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible;';
          el.appendChild(extra);
        }
      } else {
        el.className = `om-badge-pin${isTraditional ? ' om-badge-pin--traditional' : ''}`;
        el.innerHTML = `
          <span class="om-badge-icon-inner" style="background: ${catStyle.lightBg};">
            ${catStyle.iconSvg}
          </span>
        `;
        if (isTraditional) {
          const floatDelay = (Math.random() * 2.2).toFixed(2);
          const sparkleDelay = (Math.random() * 1.8 + 0.3).toFixed(2);
          el.style.setProperty('--float-delay', `${floatDelay}s`);
          el.style.setProperty('--sparkle-delay', `${sparkleDelay}s`);
          // 별 반짝이: 좌상단 3개 + 우하단 2개
          const s1d = (Math.random() * 1.5 + 0.3).toFixed(2);
          const s2d = (Math.random() * 1.7 + 0.7).toFixed(2);
          const s3d = (Math.random() * 1.9 + 0.4).toFixed(2);
          const s4d = (Math.random() * 1.3 + 1.1).toFixed(2);
          const s5d = (Math.random() * 2.0 + 0.6).toFixed(2);
          const extra = document.createElement('span');
          extra.innerHTML = `
            <span class="om-sparkle" style="top:-13px;left:-1px;font-size:15px;animation-duration:2.7s;animation-delay:${s1d}s;">✦</span>
            <span class="om-sparkle" style="top:-10px;left:13px;font-size:12px;animation-duration:3.1s;animation-delay:${s2d}s;">✧</span>
            <span class="om-sparkle" style="top:-17px;left:6px;font-size:11px;animation-duration:2.3s;animation-delay:${s3d}s;">✦</span>
            <span class="om-sparkle" style="bottom:-13px;right:-1px;font-size:14px;animation-duration:2.9s;animation-delay:${s4d}s;">✦</span>
            <span class="om-sparkle" style="bottom:-9px;right:12px;font-size:11px;animation-duration:3.4s;animation-delay:${s5d}s;">✧</span>
          `;
          extra.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible;';
          el.appendChild(extra);
        }
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

      const open = () => {
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

      el.addEventListener('mouseenter', buildHoverCard);
      el.addEventListener('focus', buildHoverCard);

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
  }, [map, mode, items, level, userLocation, searchCenter]);

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

      const zIndex = isDetail ? 35 : isSelected ? 30 : isHovered ? 25 : 1;
      val.overlay.setZIndex(zIndex);
    });
  }, [selectedId, hoveredId, detailId]);

  return <Global styles={styles} />;
}
