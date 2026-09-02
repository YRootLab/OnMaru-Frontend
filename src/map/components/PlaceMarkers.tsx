'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { logger } from '@/lib/log';
import { meok, lightPalette } from '@/design-system/tokens';
import { useMapStore } from '../hooks/useMapStore';
import type { Item, PlaceCategory } from '../types';

const log = logger('map');

/** 확대/축소 단계 정의 */
const LABEL_MAX_LEVEL = 4; // 레벨 1~4: 이름표 포함 핀
const PIN_MAX_LEVEL = 7; // 레벨 5~7: 개별 원형 아이콘 뱃지 핀
// 레벨 8~11: 광역 지역별 스마트 클러스터 뱃지

/** 각 카테고리별 눈이 편안한 부드러운 파스텔 톤 및 React SVG 아이콘 */
export const CATEGORY_STYLES: Record<
  PlaceCategory,
  {
    main: string;
    lightBg: string;
    border: string;
    iconSvg: string;
  }
> = {
  // 1. 고택·명소 / 한옥마을: Landmark (#1E7A68, #E6F5F0)
  spot: {
    main: '#1E7A68',
    lightBg: '#E6F5F0',
    border: '#1E7A68',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="22" y2="22"/><line x1="6" x2="6" y1="18"/><line x1="10" x2="10" y1="18"/><line x1="14" x2="14" y1="18"/><line x1="18" x2="18" y1="18"/><polygon points="12 2 20 7 4 7"/></svg>`,
  },
  // 2. 문화재·서원 / 궁궐·미술관: BookOpen (#2563EB, #EEF4FF)
  culture: {
    main: '#2563EB',
    lightBg: '#EEF4FF',
    border: '#2563EB',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  },
  // 3. 한옥숙소 / 고택스테이: Home (#4D7C0F, #F7FEE7)
  stay: {
    main: '#4D7C0F',
    lightBg: '#F7FEE7',
    border: '#4D7C0F',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  // 4. 향토음식 / 한식당: Utensils (#9F1239, #FFF1F2)
  food: {
    main: '#9F1239',
    lightBg: '#FFF1F2',
    border: '#9F1239',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M12 2v20"/><path d="M21 15v7"/></svg>`,
  },
  // 5. 한옥카페·디저트 / 전통찻집: Coffee (#78350F, #FDF4E7)
  cafe: {
    main: '#78350F',
    lightBg: '#FDF4E7',
    border: '#78350F',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
  },
  // 6. 한복·전통체험 / 민속촌: Sparkles (#7C3AED, #F3E8FF)
  experience: {
    main: '#7C3AED',
    lightBg: '#F3E8FF',
    border: '#7C3AED',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
  // 7. 야행·축제: Moon (#4338CA, #EEF2FF)
  festival: {
    main: '#4338CA',
    lightBg: '#EEF2FF',
    border: '#4338CA',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  // 8. 전통시장: Store (#0D9488, #E6FFFA)
  market: {
    main: '#0D9488',
    lightBg: '#E6FFFA',
    border: '#0D9488',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"/></svg>`,
  },
};

const styles = css`
  /* 1. 상세 확대 시: 이름표 포함 핀 마커 */
  .om-pin {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3.5px 10px 3.5px 4.5px;
    border-radius: 9999px;
    background: #ffffff;
    border: none;
    box-shadow: none;
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease;
  }

  .om-pin:hover,
  .om-pin[data-hovered='true'] {
    transform: translateY(-5px) scale(1.1);
    box-shadow: none;
    z-index: 25 !important;
  }

  .om-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 6px;
    height: 6px;
    background: inherit;
    transform: translate(-50%, -3px) rotate(45deg);
  }

  .om-pin-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .om-pin[data-dimmed='true'],
  .om-badge-pin[data-dimmed='true'] {
    opacity: 0.35;
    filter: grayscale(30%);
  }

  .om-pin[data-selected='true'],
  .om-pin[data-detail='true'] {
    color: #ffffff !important;
    transform: translateY(-6px) scale(1.15);
    box-shadow: none;
    z-index: 35 !important;
    opacity: 1 !important;
  }

  .om-pin[data-selected='true'] .om-pin-icon-box,
  .om-pin[data-detail='true'] .om-pin-icon-box {
    background: #ffffff !important;
  }

  /* 2. 중간 확대 시: 파스텔 톤 원형 아이콘 뱃지 마커 */
  .om-badge-pin {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    box-shadow: none;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease, color 0.15s ease;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-4px) scale(1.22);
    box-shadow: none;
    z-index: 25 !important;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: translateY(-5px) scale(1.35);
    color: #ffffff !important;
    border: none;
    box-shadow: none;
    z-index: 35 !important;
    opacity: 1 !important;
  }

  .om-badge-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 5px;
    height: 5px;
    background: inherit;
    transform: translate(-50%, -3px) rotate(45deg);
  }

  /* 3. 🌟 전국/광역 축소 조망 시: 정갈한 지역별 숫자 클러스터 뱃지 (Marker Cluster) */
  .om-cluster-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px 5px 8px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    border: none;
    box-shadow: none;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    white-space: nowrap;
  }

  .om-cluster-pill:hover {
    transform: translate(-50%, -54%) scale(1.12);
    box-shadow: none;
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
`;

/** 아이템 목록에서 대표 지역/시·군 명칭 추출 */
function extractClusterRegionName(clusterItems: Item[]): string {
  const counts: Record<string, number> = {};
  for (const item of clusterItems) {
    if (!item.addr) continue;
    const parts = item.addr.split(' ');
    let name = parts[0] || '';
    if (parts.length >= 2 && (parts[0].includes('도') || parts[0].includes('시'))) {
      name = parts[1] || parts[0];
    }
    name = name.replace(/특별자치도|특별자치시|광역시|도|시|군|구/g, '');
    if (name.length >= 2) {
      counts[name] = (counts[name] || 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '한옥명소';
}

interface ClusterGroup {
  lat: number;
  lng: number;
  items: Item[];
}

/** 줌 레벨에 맞춘 지능형 공간 격자 클러스터링 알고리즘 */
function clusterNearbyItems(items: Item[], level: number): ClusterGroup[] {
  // 줌 레벨별 클러스터 격자 크기 (위도/경도 도 단위)
  const cellSize = level >= 10 ? 0.55 : level >= 9 ? 0.32 : 0.18;
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
        el.innerHTML = `
          <span class="om-cluster-icon-box" style="background: ${catStyle.lightBg}; color: ${catStyle.main}">
            ${catStyle.iconSvg}
          </span>
          <span class="om-cluster-region-name">${regionName}</span>
          <span class="om-cluster-count-badge" style="background: ${catStyle.main}">
            ${count}
          </span>
        `;

        el.addEventListener('click', () => {
          const currentLevel = map.getLevel();
          const targetLevel = Math.max(1, currentLevel - 3);
          map.setLevel(targetLevel, { animate: true });
          map.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
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

    // 개별 핀 마커 생성 (최대 120개로 제한하여 메모리 및 카카오맵 렌더링 극대화)
    const withLabel = level <= LABEL_MAX_LEVEL;
    const targetItems = items.slice(0, 120);

    targetItems.forEach((item) => {
      const el = document.createElement('div');
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.spot;

      if (withLabel) {
        el.className = 'om-pin';
        el.style.position = 'relative';
        el.innerHTML = `<span class="om-pin-icon-box" style="background: ${catStyle.lightBg}; color: ${catStyle.main};">${catStyle.iconSvg}</span><span>${item.name}</span>`;
      } else {
        el.className = 'om-badge-pin';
        el.style.background = catStyle.lightBg;
        el.style.color = catStyle.main;
        el.style.borderColor = catStyle.main;
        el.innerHTML = catStyle.iconSvg;
      }

      el.dataset.category = item.category;

      el.addEventListener('click', () => {
        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.setDetailId(item.id);
        store.map?.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        store.setSheetSnap('full');
      });

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
  }, [map, mode, items, level > PIN_MAX_LEVEL, level <= LABEL_MAX_LEVEL]);

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
