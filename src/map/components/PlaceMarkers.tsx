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
    border: string;
    iconSvg: string;
  }
> = {
  // 1. 고택·명소 / 한옥마을: Landmark (선명한 단청 청록 #047857)
  spot: {
    main: '#047857',
    lightBg: '#ECFDF5',
    border: '#047857',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="22" y2="22"/><line x1="6" x2="6" y1="18"/><line x1="10" x2="10" y1="18"/><line x1="14" x2="14" y1="18"/><line x1="18" x2="18" y1="18"/><polygon points="12 2 20 7 4 7"/></svg>`,
  },
  // 2. 문화재·서원 / 궁궐·미술관: BookOpen (딥 로열 블루 #1D4ED8)
  culture: {
    main: '#1D4ED8',
    lightBg: '#EFF6FF',
    border: '#1D4ED8',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  },
  // 3. 한옥숙소 / 고택스테이: Home (품격 있는 한옥 목조 골드브라운 #92400E)
  stay: {
    main: '#92400E',
    lightBg: '#FEF3C7',
    border: '#92400E',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  // 4. 향토음식 / 한식당: Utensils (단청 진홍 레드 #DC2626)
  food: {
    main: '#DC2626',
    lightBg: '#FEE2E2',
    border: '#DC2626',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M12 2v20"/><path d="M21 15v7"/></svg>`,
  },
  // 5. 한옥카페·디저트 / 전통찻집: Coffee (전통 찻집 웜 오렌지 #C2410C)
  cafe: {
    main: '#C2410C',
    lightBg: '#FFF7ED',
    border: '#C2410C',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
  },
  // 6. 한복·전통체험 / 민속촌: Sparkles (비비드 바이올렛 #7C3AED)
  experience: {
    main: '#7C3AED',
    lightBg: '#F5F3FF',
    border: '#7C3AED',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
  // 7. 야행·축제: Moon (밤하늘 인디고 #4338CA)
  festival: {
    main: '#4338CA',
    lightBg: '#EEF2FF',
    border: '#4338CA',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  // 8. 전통시장: Store (전통 청자 틸 #0D9488)
  market: {
    main: '#0D9488',
    lightBg: '#F0FDFA',
    border: '#0D9488',
    iconSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"/></svg>`,
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
    transform: translateY(-6px) scale(1.1);
    box-shadow: 0 10px 24px -2px rgba(25, 31, 40, 0.3);
    z-index: 35 !important;
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
    animation: om-pin-spring 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    z-index: 40 !important;
    opacity: 1 !important;
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
    border: 2.5px solid #ffffff;
    box-shadow: 0 4px 16px rgba(25, 31, 40, 0.28), 0 1px 4px rgba(25, 31, 40, 0.12);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-6px) scale(1.25);
    box-shadow: 0 8px 24px rgba(25, 31, 40, 0.35);
    z-index: 35 !important;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: translateY(-6px) scale(1.35);
    background: #191F28 !important;
    color: #ffffff !important;
    border-color: #ffffff !important;
    box-shadow: 0 8px 28px rgba(25, 31, 40, 0.45);
    z-index: 40 !important;
    opacity: 1 !important;
    animation: om-pin-spring 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .om-badge-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 6px;
    height: 6px;
    background: inherit;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    transform: translate(-50%, -3px) rotate(45deg);
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
    .om-pin-hover-card {
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
        el.className = 'om-pin';
        el.style.position = 'relative';
        el.innerHTML = `
          <span class="om-pin-icon-box" style="background: ${catStyle.main}; color: #ffffff;">${catStyle.iconSvg}</span>
          <span>${escapeHtml(item.name)}</span>
        `;
      } else {
        el.className = 'om-badge-pin';
        el.style.background = catStyle.main;
        el.style.color = '#ffffff';
        el.innerHTML = catStyle.iconSvg;
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
