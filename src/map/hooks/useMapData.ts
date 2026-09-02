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
    const { setItems, setLoading, setError } = useMapStore.getState();
    if (!map || mode !== 'info') {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const radius = Math.round(radiusFromMap(map));

    const params = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      radius: String(radius),
    });
    if (category) params.set('category', category);

    setLoading(true);
    setError(null);
    const t0 = performance.now();
    log.log('fetch', { ...Object.fromEntries(params), mode });

    fetch(`/api/map/places?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        const items = Array.isArray(json.items) ? json.items : [];
        log.log('items', items.length, `${Math.round(performance.now() - t0)}ms`, json.error ?? '');
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
