'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { loadWarmth } from '@/features/map/warmth/warmthRepo';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { visitReviewsToWarmths } from '@/features/map/warmth/visitReviewWarmthAdapter';
import { defaultVisitReviewRepository } from '@/features/visit-review/api/visitReviewApi';
import type { HeatDay, Item, KakaoMap } from '@/features/map/types';

const log = logger('map');


function radiusFromMap(map: KakaoMap): number {
  const bounds = map.getBounds?.();
  if (!bounds) return 3000;
  const ne = bounds.getNorthEast();
  const c = map.getCenter();
  return distanceInMeters(
    { lat: c.getLat(), lng: c.getLng() },
    { lat: ne.getLat(), lng: ne.getLng() },
  );
}











function searchRadius(map: KakaoMap, centerLat: number, centerLng: number): number {
  const c = map.getCenter?.();
  const offset = c
    ? distanceInMeters(
        { lat: centerLat, lng: centerLng },
        { lat: c.getLat(), lng: c.getLng() },
      )
    : 0;


  return Math.max(1000, Math.round(offset + radiusFromMap(map)));
}

// 캐싱은 백엔드에서 처리 — 프론트는 API 응답을 그대로 사용


export function useMapData() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const searchCenter = useMapStore((s) => s.searchCenter);
  const reloadNonce = useMapStore((s) => s.reloadNonce);
  const level = useMapStore((s) => s.level);

  useEffect(() => {
    useMapStore.getState().setWarmths(loadWarmth());
  }, []);

  useEffect(() => {
    if (mode !== 'warmth') return;

    let cancelled = false;
    defaultVisitReviewRepository
      .listReviews({ scope: 'ALL', limit: 50 })
      .then((page) => {
        if (cancelled) return;
        const serverWarmths = visitReviewsToWarmths(page.items);
        if (serverWarmths.length > 0) {
          useMapStore.getState().setWarmths(loadWarmth(serverWarmths));
        }
      })
      .catch((err) => {
        log.warn('서버 온기 이야기 동기화 폴백 유지', err);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, reloadNonce]);

  useEffect(() => {
    const { setItems, setLoading, setError, setWarmths } = useMapStore.getState();
    if (!map) {
      return;
    }

    const radius = searchRadius(map, searchCenter.lat, searchCenter.lng);
    const roundedLat = Math.round(searchCenter.lat * 100) / 100;
    const roundedLng = Math.round(searchCenter.lng * 100) / 100;
    const roundedRadius = Math.round(radius / 1000) * 1000;
    const cacheKey = `${roundedLat}_${roundedLng}_${roundedRadius}_${category || 'all'}`;
    const heatCacheKey = `${roundedLat}_${roundedLng}_${level}`;
    const controller = new AbortController();
    const warmthParams = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      level: String(level),
      radius: String(Math.max(radius, level <= 5 ? 5000 : 15000)),
    });


    const cachedHeat = clientHeatCache.get(heatCacheKey);
    if (cachedHeat && cachedHeat.expiresAt > Date.now()) {
      useMapStore.getState().setHeatSpots(cachedHeat.spots);
      useMapStore.getState().setHeatDays(cachedHeat.days);
    } else {
      fetch(`/api/map/heat?${warmthParams}`, { signal: controller.signal })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (Array.isArray(json.spots) && json.spots.length > 0) {
            const days: HeatDay[] = Array.isArray(json.days) ? json.days : [];
            clientHeatCache.set(heatCacheKey, {
              expiresAt: Date.now() + CLIENT_CACHE_TTL,
              spots: json.spots,
              days,
            });
            useMapStore.getState().setHeatSpots(json.spots);
            useMapStore.getState().setHeatDays(days);
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          log.warn('권역 히트스팟 패치 실패:', err);
        });
    }

    if (mode !== 'warmth') {
      fetch(`/api/map/warmth?${warmthParams}`, { signal: controller.signal })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (Array.isArray(json.warmths) && json.warmths.length > 0) {
            const merged = loadWarmth(json.warmths);
            setWarmths(merged);
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          log.warn('온기 API 동기화 폴백 유지', err);
        });
    }


    const cached = clientPlaceCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setItems(cached.items);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      radius: String(radius),
    });
    if (category && mode === 'info') params.set('category', category);

    setLoading(true);
    setError(null);
    const t0 = performance.now();
    log.log('fetch', { ...Object.fromEntries(params), mode });

    fetch(`/api/map/places?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        const items: Item[] = Array.isArray(json.items) ? json.items : [];
        log.log('items', items.length, `${Math.round(performance.now() - t0)}ms`, json.error ?? '');

        const failed = !res.ok || Boolean(json.error);












        if (!failed) {
          clientPlaceCache.set(cacheKey, {
            expiresAt: Date.now() + CLIENT_CACHE_TTL,
            items,
          });


          const currentDetailId = useMapStore.getState().detailId;
          const currentItems = useMapStore.getState().items;
          const targetItem = currentItems.find((it) => it.id === currentDetailId);
          const nextItems =
            targetItem && !items.some((it) => it.id === targetItem.id)
              ? [targetItem, ...items]
              : items;

          setItems(nextItems);
        } else if (items.length > 0) {

          const currentDetailId = useMapStore.getState().detailId;
          const currentItems = useMapStore.getState().items;
          const targetItem = currentItems.find((it) => it.id === currentDetailId);
          const nextItems =
            targetItem && !items.some((it) => it.id === targetItem.id)
              ? [targetItem, ...items]
              : items;

          setItems(nextItems);
        }


        useSorimaruAudioStore
          .getState()
          .fetchRegionalSorimaruStories(searchCenter.lng, searchCenter.lat);

        if (!res.ok || json.error) {
          setError(typeof json.error === 'string' ? json.error : '장소를 불러오지 못했어요');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        log.error('fetch 실패', err);

        setError(err instanceof Error ? err.message : '장소를 불러오지 못했어요');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [map, mode, category, searchCenter.lat, searchCenter.lng, level, reloadNonce]);
}
