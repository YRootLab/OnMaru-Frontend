'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { fetchWarmthData } from '@/features/map/services/warmth.service';
import type { KakaoMap } from '@/features/map/types';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';

const log = logger('map');

function radiusFromMap(map: KakaoMap): number {
  const bounds = map.getBounds?.();
  if (!bounds) return 3_000;
  const northEast = bounds.getNorthEast();
  const center = map.getCenter();
  return distanceInMeters(
    { lat: center.getLat(), lng: center.getLng() },
    { lat: northEast.getLat(), lng: northEast.getLng() },
  );
}

function searchRadius(map: KakaoMap, centerLat: number, centerLng: number): number {
  const center = map.getCenter?.();
  const offset = center
    ? distanceInMeters(
        { lat: centerLat, lng: centerLng },
        { lat: center.getLat(), lng: center.getLng() },
      )
    : 0;

  return Math.max(1_000, Math.round(offset + radiusFromMap(map)));
}

export function useMapData() {
  const mode = useMapStore((state) => state.mode);
  const searchCenter = useMapStore((state) => state.searchCenter);
  const committedRadius = useMapStore((state) => state.committedViewport.radius);

  useEffect(() => {
    if (mode !== 'warmth') return;

    const controller = new AbortController();
    const initialState = useMapStore.getState();
    const level = initialState.committedViewport.level;
    const currentMap = initialState.map;
    const radius = currentMap
      ? searchRadius(currentMap, searchCenter.lat, searchCenter.lng)
      : Math.max(1_000, committedRadius || 3_000);

    fetchWarmthData({
      lat: searchCenter.lat,
      lng: searchCenter.lng,
      level,
      radius: Math.max(radius, level <= 5 ? 5_000 : 15_000),
      signal: controller.signal,
    })
      .then((response) => {
        const store = useMapStore.getState();
        store.setHeatSpots(response.spots ?? []);
        store.setHeatDays(response.days ?? []);
        if (response.noticeMessage) {
          store.setError(response.noticeMessage);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        log.warn('권역 히트스팟 패치 실패:', error);
      });

    return () => controller.abort();
  }, [mode, searchCenter.lat, searchCenter.lng, committedRadius]);
}
