'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { loadWarmth } from '@/map/warmth/warmthRepo';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import type { KakaoMap } from '@/map/types';

const log = logger('map');

/** 지도 뷰포트 기반 탐색 반경(m) 계산 */
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

const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5분 클라이언트 캐시
const clientPlaceCache = new Map<string, { expiresAt: number; items: any[] }>();

/** 지도 장소 목록 및 온기 데이터 실시간 동기화 훅 */
export function useMapData() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const searchCenter = useMapStore((s) => s.searchCenter);
  const reloadNonce = useMapStore((s) => s.reloadNonce);

  useEffect(() => {
    useMapStore.getState().setWarmths(loadWarmth());
  }, []);

  useEffect(() => {
    const { setItems, setLoading, setError, setWarmths } = useMapStore.getState();
    if (!map) {
      setLoading(false);
      return;
    }

    const radius = Math.round(radiusFromMap(map));
    const roundedLat = Math.round(searchCenter.lat * 100) / 100;
    const roundedLng = Math.round(searchCenter.lng * 100) / 100;
    const roundedRadius = Math.round(radius / 1000) * 1000;
    const cacheKey = `${roundedLat}_${roundedLng}_${roundedRadius}_${category || 'all'}`;
    const controller = new AbortController();
    const warmthParams = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      radius: String(Math.max(radius, 6000)),
    });

    // 1. 우버 스타일 실시간 혼잡도 & 방문자 집중도 히트스팟 패치 (TOUR_API_CONGESTION_KEY & TOUR_API_VISITOR_KEY)
    fetch(`/api/map/heat?${warmthParams}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (Array.isArray(json.spots) && json.spots.length > 0) {
          useMapStore.getState().setHeatSpots(json.spots);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        log.warn('우버 히트스팟 패치 폴백', err);
      });

    // 2. 온기 API 실시간 연동 (현재 지도 위치/반경 내 TourAPI 장소 기반 온기 수집)
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

    // 2. 장소 목록 조회 (클라이언트 메모리 캐시 히트 시 즉각 렌더링)
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
        const items = Array.isArray(json.items) ? json.items : [];
        log.log('items', items.length, `${Math.round(performance.now() - t0)}ms`, json.error ?? '');

        // 클라이언트 캐시에 저장
        clientPlaceCache.set(cacheKey, {
          expiresAt: Date.now() + CLIENT_CACHE_TTL,
          items,
        });

        setItems(items);

        // 오디 도슨트 해설 데이터 동기화
        useOdiiAudioStore
          .getState()
          .fetchRegionalOdiiStories(searchCenter.lng, searchCenter.lat);

        if (!res.ok || json.error) {
          setError(typeof json.error === 'string' ? json.error : '장소를 불러오지 못했습니다');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        log.error('fetch 실패', err);
        setItems([]);
        setError(err instanceof Error ? err.message : '장소를 불러오지 못했습니다');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [map, mode, category, searchCenter.lat, searchCenter.lng, reloadNonce]);
}
