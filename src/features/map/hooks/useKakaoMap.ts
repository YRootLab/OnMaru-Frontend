'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { distanceInMeters } from '@/features/map/utils/geo';
import { useMapStore } from './useMapStore';


export const KAKAO_SDK_SRC =
  `https://dapi.kakao.com/v2/maps/sdk.js` +
  `?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}` +
  `&libraries=services,clusterer&autoload=false`;


const REFETCH_DISTANCE = 1200;


const IDLE_DEBOUNCE_MS = 550;




export { distanceInMeters };





export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>) {
  const createdRef = useRef(false);
  const disposeRef = useRef<(() => void) | null>(null);

  const initMap = useCallback(() => {
    const container = containerRef.current;
    if (createdRef.current || !container || !window.kakao?.maps) return;
    createdRef.current = true;

    window.kakao.maps.load(() => {
      const { center, level, setMap, setCenter } = useMapStore.getState();
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const onIdle = () => {
        const c = map.getCenter();
        const nextLevel = map.getLevel();
        const next = { lat: c.getLat(), lng: c.getLng() };






        const prev = useMapStore.getState();
        const zoomChanged = nextLevel !== prev.level;
        const moved = distanceInMeters(next, prev.searchCenter) >= REFETCH_DISTANCE;

        setCenter(next, nextLevel);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (zoomChanged || moved) {
            useMapStore.getState().clearSearchDirty();
            if (zoomChanged) {
              useMapStore.getState().reload();
            }
          }
        }, IDLE_DEBOUNCE_MS);
      };

      window.kakao.maps.event.addListener(map, 'idle', onIdle);





      disposeRef.current = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        window.kakao?.maps?.event?.removeListener(map, 'idle', onIdle);
      };

      setMap(map);
    });
  }, [containerRef]);


  useEffect(() => {
    initMap();
    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
      createdRef.current = false;
      useMapStore.getState().setMap(null);
    };
  }, [initMap]);

  return initMap;
}
