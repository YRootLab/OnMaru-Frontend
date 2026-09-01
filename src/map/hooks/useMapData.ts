'use client';

import { useEffect } from 'react';
import { loadWarmth } from '../warmth/warmthRepo';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';
import type { KakaoMap } from '../types';

/**
 * 현재 화면이 담고 있는 반경(m). 중심에서 북동쪽 모서리까지가 곧 요청 반경이다.
 * locationBasedList2 상한이 20km라 lib에서 한 번 더 자른다.
 */
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

/**
 * 지도 데이터 공급.
 * - 온기는 로컬에서 한 번 읽는다 (씨앗 + 내가 남긴 것).
 * - 장소는 지도가 준비되거나 카테고리/검색중심이 바뀔 때만 TourAPI를 친다.
 *   지도를 움직이는 동안은 절대 안 친다 — 그래서 "이 지역 재검색" 버튼이 있는 것.
 */
export function useMapData() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const searchCenter = useMapStore((s) => s.searchCenter);

  useEffect(() => {
    useMapStore.getState().setWarmths(loadWarmth());
  }, []);

  useEffect(() => {
    if (!map || mode !== 'info') return;

    const { setItems, setLoading, setError } = useMapStore.getState();
    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(searchCenter.lat),
      lng: String(searchCenter.lng),
      radius: String(Math.round(radiusFromMap(map))),
    });
    if (category) params.set('category', category);

    setLoading(true);
    setError(null);

    fetch(`/api/map/places?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? '장소를 불러오지 못했습니다');
        setItems(json.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setItems([]);
        setError(err instanceof Error ? err.message : '장소를 불러오지 못했습니다');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [map, mode, category, searchCenter]);
}
