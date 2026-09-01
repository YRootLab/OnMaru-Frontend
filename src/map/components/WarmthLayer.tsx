'use client';

import { useEffect } from 'react';
import { Global, css } from '@emotion/react';
import { lightPalette, meok } from '@/design-system/tokens';
import { paintOverlays } from '../hooks/overlay';
import { useMapStore } from '../hooks/useMapStore';
import { clusterWarmth, filterWarmth } from '../warmth/warmthRepo';
import type { WarmthFilter } from '../types';

const ACCENT = lightPalette.juhong[500];

/** 이 레벨까지 확대하면 격자를 풀고 한줄평을 그대로 띄운다. */
const BUBBLE_MAX_LEVEL = 4;
/** blob 지름 = BASE + 온기 수 × STEP (상한까지). */
const BLOB_BASE = 46;
const BLOB_STEP = 3.6;
const BLOB_MAX = 118;

const styles = css`
  /* 우버st 가중 blob — 격자 셀 하나가 원 하나다. 온기가 많을수록 크고 진하다. */
  .om-blob {
    display: grid;
    place-items: center;
    width: var(--om-size);
    height: var(--om-size);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(232, 90, 24, var(--om-alpha)) 0%,
      rgba(232, 90, 24, calc(var(--om-alpha) * 0.45)) 45%,
      rgba(232, 90, 24, 0) 72%
    );
    cursor: pointer;
    transition: transform 0.18s ease-out;
  }

  .om-blob:hover {
    transform: scale(1.08);
  }

  .om-blob-count {
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    border-radius: 9999px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.2);
    font-size: 13px;
    font-weight: 700;
    color: ${ACCENT};
    font-variant-numeric: tabular-nums;
  }

  /* 확대하면 온기가 말풍선으로 풀린다 — 지도 위에서 한줄평이 바로 읽히는 게 핵심. */
  .om-bud {
    position: relative;
    max-width: 190px;
    padding: 8px 11px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 3px 14px rgba(25, 31, 40, 0.18);
    cursor: pointer;
    transition: transform 0.15s ease-out;
  }

  .om-bud:hover {
    transform: translateY(-2px);
  }

  .om-bud::after {
    content: '';
    position: absolute;
    left: 18px;
    top: 100%;
    border: 6px solid transparent;
    border-top-color: #ffffff;
  }

  .om-bud-head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 700;
    color: ${ACCENT};
  }

  .om-bud-mood {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(232, 90, 24, 0.1);
    font-size: 10px;
    font-weight: 600;
  }

  .om-bud-text {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.4;
    color: ${meok[900]};
    word-break: keep-all;
  }

  .om-bud[data-mine='true'] {
    outline: 2px solid ${ACCENT};
  }
`;

export default function WarmthLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const category = useMapStore((s) => s.category);
  const level = useMapStore((s) => s.level);

  useEffect(() => {
    if (!map || mode !== 'warmth' || warmths.length === 0) return;

    const list = filterWarmth(warmths, (category ?? 'all') as WarmthFilter);
    if (list.length === 0) return;

    const select = (placeId: string, lat: number, lng: number) => {
      const store = useMapStore.getState();
      store.setSelectedId(placeId);
      store.map?.panTo(new window.kakao.maps.LatLng(lat, lng));
      if (store.sheetSnap === 'peek') store.setSheetSnap('half');
    };

    if (level <= BUBBLE_MAX_LEVEL) {
      const specs = list.slice(0, 40).map((w) => {
        const el = document.createElement('div');
        el.className = 'om-bud';
        el.dataset.mine = String(Boolean(w.mine));
        el.innerHTML =
          `<div class="om-bud-head"><span class="om-bud-mood">${w.mood}</span>${w.placeName}</div>` +
          `<p class="om-bud-text">${w.text}</p>`;
        el.addEventListener('click', () => select(w.placeId, w.lat, w.lng));
        return { lat: w.lat, lng: w.lng, el, zIndex: w.mine ? 20 : 2 };
      });
      return paintOverlays(map, specs);
    }

    const cells = clusterWarmth(list, level);
    const busiest = Math.max(...cells.map((c) => c.count));

    const specs = cells.map((cell) => {
      const el = document.createElement('div');
      el.className = 'om-blob';
      const size = Math.min(BLOB_MAX, BLOB_BASE + cell.count * BLOB_STEP);
      el.style.setProperty('--om-size', `${size}px`);
      // 가장 뜨거운 셀을 기준으로 농도를 잡는다 — 어디가 더 뜨거운지가 읽혀야 한다.
      el.style.setProperty('--om-alpha', String(0.22 + 0.4 * (cell.count / busiest)));
      el.innerHTML = `<span class="om-blob-count">${cell.count}</span>`;

      el.addEventListener('click', () => {
        const m = useMapStore.getState().map;
        m?.setLevel(Math.max(1, m.getLevel() - 2), { animate: true });
        m?.panTo(new window.kakao.maps.LatLng(cell.lat, cell.lng));
      });

      return { lat: cell.lat, lng: cell.lng, el, yAnchor: 0.5, zIndex: 1 };
    });

    return paintOverlays(map, specs);
  }, [map, mode, warmths, category, level]);

  return <Global styles={styles} />;
}
