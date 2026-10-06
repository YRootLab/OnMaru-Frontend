'use client';

import { useCallback } from 'react';
import { useMapStore } from '@/features/map/hooks/useMapStore';

export function useInfoMapHomeNavigation() {
  const infoCategory = useMapStore((state) => state.infoCategory);
  const infoRegionCode = useMapStore((state) => state.infoRegionCode);

  const captureBeforeNavigation = useCallback(() => {
    useMapStore.getState().captureInfoHomeSnapshot();
  }, []);

  const returnToInfoHome = useCallback(() => {
    const store = useMapStore.getState();
    const snapshot = store.consumeInfoHomeSnapshot();

    store.setInfoCategory('hanok');
    store.setSearchQuery('한옥');
    store.setSelectedId(null);
    store.setHoveredId(null);
    store.setDetailId(null);

    if (!snapshot) return;

    const maps = window.kakao?.maps;
    if (store.map && maps) {
      store.map.setCenter(new maps.LatLng(
        snapshot.viewport.center.lat,
        snapshot.viewport.center.lng,
      ));
      store.map.setLevel(snapshot.viewport.level);
    }
    store.setCenter(snapshot.viewport.center, snapshot.viewport.level);
    store.commitViewportSearch(snapshot.viewport);
  }, []);

  return {
    isInfoHome: infoCategory === 'hanok' && infoRegionCode === null,
    captureBeforeNavigation,
    returnToInfoHome,
  };
}
