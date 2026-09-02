'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { loadWarmth } from '../warmth/warmthRepo';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import type { KakaoMap } from '../types';

const log = logger('map');

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
  const reloadNonce = useMapStore((s) => s.reloadNonce);

  useEffect(() => {
    useMapStore.getState().setWarmths(loadWarmth());
  }, []);

  useEffect(() => {
    const { setItems, setLoading, setError } = useMapStore.getState();
    // 정보모드가 아니거나 지도가 아직 없으면 로딩을 반드시 내린다.
    // 안 그러면 fetch 도중 모드를 바꿨을 때 loading이 true로 영영 박힌다.
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
        // 라우트는 실패해도 200 + items:[] + error 를 준다. 상태코드가 아니라 body를 본다.
        const json = await res.json().catch(() => ({}));
        const items = Array.isArray(json.items) ? json.items : [];
        log.log('items', items.length, `${Math.round(performance.now() - t0)}ms`, json.error ?? '');
        setItems(items);

        // 실시간 Odii API에서 현재 지도 뷰포트 반경의 공식 도슨트 해설 데이터 동적 인덱싱 & Zustand 상태 업데이트
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
      // 중단된 요청은 뒤이은 요청의 loading=true를 덮어쓰면 안 된다.
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [map, mode, category, searchCenter.lat, searchCenter.lng, reloadNonce]);
}
