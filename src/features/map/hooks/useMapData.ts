'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { arePlaceResultsEqual } from '@/features/map/services/placeResultIdentity';
import { fetchWarmthData } from '@/features/map/services/warmth.service';
import type { Item, KakaoMap } from '@/features/map/types';
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
  const map = useMapStore((state) => state.map);
  const mode = useMapStore((state) => state.mode);
  const category = useMapStore((state) => state.category);
  const searchCenter = useMapStore((state) => state.searchCenter);
  const reloadNonce = useMapStore((state) => state.reloadNonce);

  useEffect(() => {
    if (!map) return;

    const controller = new AbortController();
    const initialState = useMapStore.getState();
    const level = initialState.committedViewport.level;
    const radius = searchRadius(map, searchCenter.lat, searchCenter.lng);

    if (mode === 'warmth') {
      fetchWarmthData({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
        level,
        radius: Math.max(radius, level <= 5 ? 5_000 : 15_000),
        signal: controller.signal,
      })
        .then((response) => {
          if (response.spots && response.spots.length > 0) {
            const store = useMapStore.getState();
            store.setHeatSpots(response.spots);
            store.setHeatDays(response.days);
          }
          if (response.noticeMessage) {
            useMapStore.getState().setError(response.noticeMessage);
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          log.warn('권역 히트스팟 패치 실패:', error);
        });

      return () => controller.abort();
    }

    const params = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      radius: String(radius),
    });
    if (category) params.set('category', category);

    const isInitialRequest = initialState.items.length === 0;
    if (isInitialRequest) {
      initialState.setLoading(true);
      initialState.setError(null);
    }

    const startedAt = performance.now();
    log.log('fetch', { ...Object.fromEntries(params), mode });

    fetch(`/api/map/places?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        const items: Item[] = Array.isArray(json.items) ? json.items : [];
        const failed = !response.ok || Boolean(json.error);
        log.log(
          'items',
          items.length,
          `${Math.round(performance.now() - startedAt)}ms`,
          json.error ?? '',
        );

        const store = useMapStore.getState();
        if (!failed) {
          const currentItems = store.items;
          const targetItem = currentItems.find((item) => item.id === store.detailId);
          const nextItems =
            targetItem && !items.some((item) => item.id === targetItem.id)
              ? [targetItem, ...items]
              : items;

          if (!arePlaceResultsEqual(currentItems, nextItems)) {
            store.setItems(nextItems);
          }
          store.setError(null);
          return;
        }

        if (store.items.length === 0) {
          store.setError(
            typeof json.error === 'string' ? json.error : '장소를 불러오지 못했어요',
          );
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        log.error('fetch 실패', error);

        const store = useMapStore.getState();
        if (store.items.length === 0) {
          store.setError(error instanceof Error ? error.message : '장소를 불러오지 못했어요');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && isInitialRequest) {
          useMapStore.getState().setLoading(false);
        }
      });

    return () => controller.abort();
  }, [map, mode, category, searchCenter.lat, searchCenter.lng, reloadNonce]);
}
