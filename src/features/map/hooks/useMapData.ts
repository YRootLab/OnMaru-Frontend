'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/log';
import { arePlaceResultsEqual } from '@/features/map/services/placeResultIdentity';
import { fetchWarmthData } from '@/features/map/services/warmth.service';
import type { KakaoMap } from '@/features/map/types';
import {
  fetchMapPlaces,
  MAP_LOAD_TIMEOUT_MS,
} from '@/features/map/infrastructure/fetchMapPlaces';
import { MapLoadError, toMapLoadError } from '@/features/map/application/mapLoadError';
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
  const category = useMapStore((state) => state.category);
  const searchCenter = useMapStore((state) => state.searchCenter);
  const committedRadius = useMapStore((state) => state.committedViewport.radius);
  const reloadNonce = useMapStore((state) => state.reloadNonce);
  const attemptRef = useRef<{ key: string; startedAt: number; settled: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const initialState = useMapStore.getState();
    const level = initialState.committedViewport.level;
    const currentMap = initialState.map;
    const radius = currentMap
      ? searchRadius(currentMap, searchCenter.lat, searchCenter.lng)
      : Math.max(1_000, committedRadius || 3_000);

    if (mode === 'warmth') {
      attemptRef.current = null;
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
    }

    const requestKey = [mode, category ?? '', searchCenter.lat, searchCenter.lng, reloadNonce].join(':');
    const startedAt = performance.now();
    if (!attemptRef.current || attemptRef.current.key !== requestKey) {
      attemptRef.current = { key: requestKey, startedAt, settled: false };
    }
    const attempt = attemptRef.current;
    const isBlockingRequest = initialState.items.length === 0 && !attempt.settled;
    if (isBlockingRequest) {
      initialState.setLoading(true);
    }
    initialState.setPlaceLoadError(null);

    const timeoutMs = isBlockingRequest
      ? Math.max(1, MAP_LOAD_TIMEOUT_MS - (startedAt - attempt.startedAt))
      : MAP_LOAD_TIMEOUT_MS;
    log.log('fetch', { lat: searchCenter.lat, lng: searchCenter.lng, radius, category, mode });

    fetchMapPlaces(
      { lat: searchCenter.lat, lng: searchCenter.lng, radius, category },
      { signal: controller.signal, timeoutMs },
    )
      .then(({ items, degraded, notice }) => {
        log.log(
          'items',
          items.length,
          `${Math.round(performance.now() - startedAt)}ms`,
          notice ?? '',
        );

        const store = useMapStore.getState();
        const currentItems = store.items;
        const targetItem = currentItems.find((item) => item.id === store.detailId);
        const nextItems =
          targetItem && !items.some((item) => item.id === targetItem.id)
            ? [targetItem, ...items]
            : items;

        if (!arePlaceResultsEqual(currentItems, nextItems)) {
          store.setItems(nextItems);
        }
        store.setPlaceLoadError(
          degraded
            ? new MapLoadError('unavailable', 503, notice ?? 'Fallback map data is being shown')
            : null,
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        log.error('fetch 실패', error);
        useMapStore.getState().setPlaceLoadError(toMapLoadError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted && attemptRef.current?.key === requestKey) {
          attemptRef.current.settled = true;
          if (isBlockingRequest) {
            useMapStore.getState().setLoading(false);
          }
        }
      });

    return () => controller.abort();
  }, [mode, category, searchCenter.lat, searchCenter.lng, committedRadius, reloadNonce]);
}
