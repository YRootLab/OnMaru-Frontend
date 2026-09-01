'use client';

import { useEffect } from 'react';
import { Global, css } from '@emotion/react';
import { logger } from '@/lib/log';
import { lightPalette, meok } from '@/design-system/tokens';
import { paintOverlays } from '../hooks/overlay';
import { useMapStore } from '../hooks/useMapStore';

const log = logger('map');

const ACCENT = lightPalette.cheongrok[500];

/** 반경 검색이라 원래 많이 안 오지만, '전체'는 다섯 카테고리가 겹쳐 온다. */
const MAX_PINS = 60;
/** 이보다 축척이 커지면 이름표를 접고 점만 남긴다. */
const LABEL_MAX_LEVEL = 6;

const styles = css`
  .om-pin {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 6px;
    border-radius: 9999px;
    background: #ffffff;
    box-shadow: 0 2px 10px rgba(25, 31, 40, 0.16);
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
    transform: translateY(-6px) scale(1.14);
    box-shadow: 0 6px 18px rgba(40, 110, 95, 0.35);
    z-index: 25 !important;
  }

  .om-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 8px;
    height: 8px;
    background: inherit;
    transform: translate(-50%, -4px) rotate(45deg);
    box-shadow: 2px 2px 4px rgba(25, 31, 40, 0.08);
  }

  .om-pin-num {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 17px;
    height: 17px;
    padding: 0 3px;
    border-radius: 9999px;
    background: ${ACCENT};
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .om-pin[data-dimmed='true'],
  .om-dot[data-dimmed='true'] {
    opacity: 0.4;
    filter: grayscale(30%);
  }

  .om-pin[data-selected='true'] {
    background: ${ACCENT};
    color: #ffffff;
    transform: translateY(-6px) scale(1.15);
    box-shadow: 0 6px 20px rgba(40, 110, 95, 0.45);
    z-index: 30 !important;
    opacity: 1 !important;
  }

  .om-pin[data-detail='true'] {
    background: ${ACCENT};
    color: #ffffff;
    transform: translateY(-8px) scale(1.22);
    box-shadow: 0 8px 24px rgba(40, 110, 95, 0.5);
    z-index: 35 !important;
    opacity: 1 !important;
  }

  .om-pin[data-selected='true'] .om-pin-num,
  .om-pin[data-detail='true'] .om-pin-num {
    background: #ffffff;
    color: ${ACCENT};
  }

  /* 축척이 커지면 점만. 이름표를 다 띄우면 서로 겹쳐 아무것도 안 읽힌다. */
  .om-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: ${ACCENT};
    box-shadow: 0 1px 4px rgba(25, 31, 40, 0.3);
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.2s ease;
  }

  .om-dot:hover,
  .om-dot[data-hovered='true'] {
    transform: scale(1.35);
  }

  .om-dot[data-selected='true'],
  .om-dot[data-detail='true'] {
    width: 16px;
    height: 16px;
    background: ${meok[900]};
    transform: scale(1.25);
    opacity: 1 !important;
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

    const specs = sorted.slice(0, MAX_PINS).map((item, index) => {
      const el = document.createElement('div');
      const isDetail = item.id === detailId;
      const isSelected = item.id === selectedId || isDetail;
      const isHovered = item.id === hoveredId;
      const isDimmed = Boolean(detailId && !isDetail);

      if (withLabel) {
        el.className = 'om-pin';
        el.style.position = 'relative';
        el.innerHTML = `<span class="om-pin-num">${index + 1}</span><span>${item.name}</span>`;
      } else {
        el.className = 'om-dot';
      }
      el.dataset.selected = String(isSelected);
      el.dataset.detail = String(isDetail);
      el.dataset.hovered = String(isHovered);
      el.dataset.dimmed = String(isDimmed);

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

    log.log('핀', specs.length, `/ ${items.length}곳 · level ${level} · ${withLabel ? '이름표' : '점'}`);
    return paintOverlays(map, specs);
  }, [map, mode, items, level, selectedId, hoveredId, detailId, sortOrder]);

  return <Global styles={styles} />;
}
