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
  const initializationGenerationRef = useRef(0);

  const initMap = useCallback(() => {
    const container = containerRef.current;
    if (createdRef.current || !container || !window.kakao?.maps) return;
    createdRef.current = true;
    const generation = initializationGenerationRef.current;

    window.kakao.maps.load(() => {
      if (generation !== initializationGenerationRef.current) {
        createdRef.current = false;
        return;
      }
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
        const scheduledReloadNonce = useMapStore.getState().reloadNonce;
        debounceTimer = setTimeout(() => {
          const store = useMapStore.getState();
          if (store.reloadNonce !== scheduledReloadNonce) return;

          const latest = snapshotFromMap(map);
          if (shouldCommitViewport(latest, store.committedViewport)) {
            store.commitViewportSearch(latest);
          }
        }, VIEWPORT_SETTLE_MS);
      };

      window.kakao.maps.event.addListener(map, 'idle', onIdle);

      const onZoomChanged = () => {
        if (useMapStore.getState().mode === 'info') {
          useMapStore.getState().setIsViewportLoading(true);
        }
      };
      window.kakao.maps.event.addListener(map, 'zoom_changed', onZoomChanged);





      disposeRef.current = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        window.kakao?.maps?.event?.removeListener(map, 'idle', onIdle);
        window.kakao?.maps?.event?.removeListener(map, 'zoom_changed', onZoomChanged);
      };

      setMap(map);
    });
  }, [containerRef]);

  const resetMapInitialization = useCallback(() => {
    initializationGenerationRef.current += 1;
    disposeRef.current?.();
    disposeRef.current = null;
    createdRef.current = false;
    useMapStore.getState().setMap(null);
  }, []);


  useEffect(() => {
    initMap();
    return resetMapInitialization;
  }, [initMap, resetMapInitialization]);

  return { initMap, resetMapInitialization };
}
