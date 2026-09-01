'use client';

import { useEffect } from 'react';
import { Global, css } from '@emotion/react';
import { lightPalette, meok } from '@/design-system/tokens';
import { paintOverlays } from '../hooks/overlay';
import { useMapStore } from '../hooks/useMapStore';

const ACCENT = lightPalette.cheongrok[500];

/** 반경 검색이라 원래 많이 안 오지만, '전체'는 다섯 카테고리가 겹쳐 온다. */
const MAX_PINS = 60;
/** 이보다 축척이 커지면 이름표를 접고 점만 남긴다. */
const LABEL_MAX_LEVEL = 6;

const styles = css`
  .om-pin {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px 5px 7px;
    border-radius: 9999px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.18);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: transform 0.15s ease-out, background 0.15s ease-out;
  }

  .om-pin:hover {
    transform: translateY(-4px);
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
    box-shadow: 2px 2px 4px rgba(25, 31, 40, 0.1);
  }

  .om-pin-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${ACCENT};
  }

  .om-pin[data-selected='true'] {
    background: ${ACCENT};
    color: #ffffff;
    transform: translateY(-4px) scale(1.04);
  }

  .om-pin[data-selected='true'] .om-pin-dot {
    background: #ffffff;
  }

  /* 축척이 커지면 점만. 이름표를 다 띄우면 서로 겹쳐 아무것도 안 읽힌다. */
  .om-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: ${ACCENT};
    box-shadow: 0 1px 4px rgba(25, 31, 40, 0.3);
    cursor: pointer;
  }

  .om-dot[data-selected='true'] {
    width: 16px;
    height: 16px;
    background: ${meok[900]};
  }
`;

export default function PlaceMarkers() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const level = useMapStore((s) => s.level);
  const selectedId = useMapStore((s) => s.selectedId);

  useEffect(() => {
    if (!map || mode !== 'info' || items.length === 0) return;

    const withLabel = level <= LABEL_MAX_LEVEL;

    const specs = items.slice(0, MAX_PINS).map((item) => {
      const el = document.createElement('div');
      const selected = item.id === selectedId;

      if (withLabel) {
        el.className = 'om-pin';
        el.style.position = 'relative';
        el.innerHTML = `<span class="om-pin-dot"></span><span>${item.name}</span>`;
      } else {
        el.className = 'om-dot';
      }
      el.dataset.selected = String(selected);

      el.addEventListener('click', () => {
        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.map?.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        if (store.sheetSnap === 'peek') store.setSheetSnap('half');
      });

      // 선택된 핀은 항상 위로. 안 그러면 옆 핀에 가려 눌러 놓고도 안 보인다.
      return { lat: item.lat, lng: item.lng, el, zIndex: selected ? 20 : 1 };
    });

    return paintOverlays(map, specs);
  }, [map, mode, items, level, selectedId]);

  return <Global styles={styles} />;
}
