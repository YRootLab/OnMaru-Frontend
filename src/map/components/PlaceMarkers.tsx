'use client';

import { useEffect } from 'react';
import { Global, css } from '@emotion/react';
import { logger } from '@/lib/log';
import { meok } from '@/design-system/tokens';
import { paintOverlays } from '../hooks/overlay';
import { useMapStore } from '../hooks/useMapStore';
import type { PlaceCategory } from '../types';

const log = logger('map');

/** 전국 조망 및 광역 탐색 시 전체 아이콘 마커 표시 한도 */
const MAX_PINS = 150;
/** 이보다 축척이 커지면 이름표를 접고 통일성 있는 원형 아이콘 뱃지만 남긴다. */
const LABEL_MAX_LEVEL = 6;

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
  // 7. 야행·축제: Moon (#4338CA, #EEF2FF) — 칩의 달(Moon) 아이콘과 100% 일치!
  festival: {
    main: '#4338CA',
    lightBg: '#EEF2FF',
    border: '#4338CA',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  // 8. 전통시장: Store (#0D9488, #E6FFFA) — 칩의 상점(Store) 아이콘과 100% 일치!
  market: {
    main: '#0D9488',
    lightBg: '#E6FFFA',
    border: '#0D9488',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"/></svg>`,
  },
};

const styles = css`
  /* 1. 확대 시 이름표 포함 핀 마커 */
  .om-pin {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3.5px 10px 3.5px 4.5px;
    border-radius: 9999px;
    background: #ffffff;
    box-shadow: 0 2px 10px rgba(25, 31, 40, 0.12);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease, box-shadow 0.18s ease;
  }

  .om-pin:hover,
  .om-pin[data-hovered='true'] {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 6px 18px rgba(25, 31, 40, 0.18);
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
    box-shadow: 1px 1px 3px rgba(25, 31, 40, 0.08);
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
    box-shadow: 0 6px 20px rgba(25, 31, 40, 0.28);
    z-index: 35 !important;
    opacity: 1 !important;
  }

  .om-pin[data-selected='true'] .om-pin-icon-box,
  .om-pin[data-detail='true'] .om-pin-icon-box {
    background: #ffffff !important;
  }

  /* 2. 전국 조망 및 축척 축소 시: 파스텔 톤 원형 아이콘 뱃지 마커 */
  .om-badge-pin {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border-width: 1.5px;
    border-style: solid;
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.14);
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease, color 0.15s ease, box-shadow 0.18s ease;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-4px) scale(1.22);
    box-shadow: 0 6px 16px rgba(25, 31, 40, 0.22);
    z-index: 25 !important;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: translateY(-5px) scale(1.35);
    color: #ffffff !important;
    border-color: #ffffff !important;
    box-shadow: 0 8px 22px rgba(25, 31, 40, 0.32);
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
    border-right: 1.2px solid currentColor;
    border-bottom: 1.2px solid currentColor;
    transform: translate(-50%, -3px) rotate(45deg);
  }
`;

export default function PlaceMarkers() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const level = useMapStore((s) => s.level);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const detailId = useMapStore((s) => s.detailId);
  const sortOrder = useMapStore((s) => s.sortOrder);

  useEffect(() => {
    if (!map || mode !== 'info' || items.length === 0) return;

    const withLabel = level <= LABEL_MAX_LEVEL;

    // 리스트와 동일한 정렬 순서 적용하여 번호 일치
    const sorted = [...items].sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name, 'ko');
      return (a.dist ?? 1e9) - (b.dist ?? 1e9);
    });

    const specs = sorted.slice(0, MAX_PINS).map((item) => {
      const el = document.createElement('div');
      const isDetail = item.id === detailId;
      const isSelected = item.id === selectedId || isDetail;
      const isHovered = item.id === hoveredId;
      const isDimmed = Boolean(detailId && !isDetail);
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.spot;

      if (withLabel) {
        el.className = 'om-pin';
        el.style.position = 'relative';
        if (isSelected) {
          el.style.background = catStyle.main;
        }
        el.innerHTML = `<span class="om-pin-icon-box" style="background: ${isSelected ? '#ffffff' : catStyle.lightBg}; color: ${isSelected ? catStyle.main : catStyle.main};">${catStyle.iconSvg}</span><span>${item.name}</span>`;
      } else {
        el.className = 'om-badge-pin';
        if (isSelected) {
          el.style.background = catStyle.main;
          el.style.color = '#ffffff';
          el.style.borderColor = '#ffffff';
        } else {
          el.style.background = catStyle.lightBg;
          el.style.color = catStyle.main;
          el.style.borderColor = catStyle.main;
        }
        el.innerHTML = catStyle.iconSvg;
      }
      el.dataset.selected = String(isSelected);
      el.dataset.detail = String(isDetail);
      el.dataset.hovered = String(isHovered);
      el.dataset.dimmed = String(isDimmed);
      el.dataset.category = item.category;

      el.addEventListener('click', () => {
        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.setDetailId(item.id);
        store.map?.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        store.setSheetSnap('full');
      });

      // 상세 핀은 zIndex 35, 선택된 핀은 30, 호버는 25, 일반은 1
      const zIndex = isDetail ? 35 : isSelected ? 30 : isHovered ? 25 : 1;
      return { lat: item.lat, lng: item.lng, el, zIndex };
    });

    log.log('핀', specs.length, `/ ${items.length}곳 · level ${level} · ${withLabel ? '이름표' : '파스텔아이콘'}`);
    return paintOverlays(map, specs);
  }, [map, mode, items, level, selectedId, hoveredId, detailId, sortOrder]);

  return <Global styles={styles} />;
}
