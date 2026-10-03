'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  VIEWPORT_SETTLE_MS,
  shouldCommitViewport,
  type ViewportSnapshot,
} from '@/features/map/domain/viewportRefreshPolicy';
import type { KakaoMap, LatLng } from '@/features/map/types';
import { distanceInMeters } from '@/features/map/utils/geo';
import { useMapStore } from './useMapStore';


export const KAKAO_SDK_SRC =
  `https://dapi.kakao.com/v2/maps/sdk.js` +
  `?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}` +
  `&libraries=services,clusterer&autoload=false`;


export { distanceInMeters };

export function snapshotFromMap(
  map: KakaoMap,
  overrides: { center?: LatLng; level?: number } = {},
): ViewportSnapshot {
  const mapCenter = map.getCenter();
  const center = overrides.center ?? {
    lat: mapCenter.getLat(),
    lng: mapCenter.getLng(),
  };
  const bounds = map.getBounds?.();
  const southWest = bounds?.getSouthWest?.();
  const northEast = bounds?.getNorthEast?.();
  const radius = southWest && northEast
    ? distanceInMeters(
        { lat: southWest.getLat(), lng: southWest.getLng() },
        { lat: northEast.getLat(), lng: northEast.getLng() },
      ) / 2
    : 3_000;

  return {
    center,
    level: overrides.level ?? map.getLevel(),
    radius: Math.max(1_000, Math.round(radius)),
  };
}




export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>) {
  const createdRef = useRef(false);
  const disposeRef = useRef<(() => void) | null>(null);

  const initMap = useCallback(() => {
    const container = containerRef.current;
    if (createdRef.current || !container || !window.kakao?.maps) return;
    createdRef.current = true;

    window.kakao.maps.load(() => {
      const { center, level, setMap, setCenter, initializeCommittedViewport } = useMapStore.getState();
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      initializeCommittedViewport(snapshotFromMap(map));

      const onIdle = () => {
        const current = snapshotFromMap(map);
        setCenter(current.center, current.level);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const latest = snapshotFromMap(map);
          const store = useMapStore.getState();
          if (shouldCommitViewport(latest, store.committedViewport)) {
            store.commitViewportSearch(latest);
          }
        }, VIEWPORT_SETTLE_MS);
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
