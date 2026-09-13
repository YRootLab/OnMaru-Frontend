'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/log';
import { loadWarmth } from '@/features/map/warmth/warmthRepo';
import { distanceInMeters } from './useKakaoMap';
import { useMapStore } from './useMapStore';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import type { HeatDay, Item, KakaoMap } from '@/features/map/types';

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

/**
 * 조회 반경.
 *
 * 장소 조회의 중심은 지도 중심이 아니라 searchCenter(마지막 검색 지점)다.
 * 팬할 때마다 다시 부르지 않으려는 설계인데, 반경만 현재 줌을 따라 줄어들고 있었다.
 * 그래서 확대하면 조회 원이 searchCenter 주위로 쪼그라들고, 지도를 옮겨 보던 화면이
 * 그 원 밖으로 밀려나 장소가 0개가 됐다 — '확대하면 핀이 사라진다'가 이것이다.
 *
 * 중심이 searchCenter라면 반경도 그 중심에서 지금 화면을 덮을 만큼이어야 한다.
 */
function searchRadius(map: KakaoMap, centerLat: number, centerLng: number): number {
  const c = map.getCenter?.();
  const offset = c
    ? distanceInMeters(
        { lat: centerLat, lng: centerLng },
        { lat: c.getLat(), lng: c.getLng() },
      )
    : 0;

  // 확대해도 최소 1km는 훑는다. 화면만 딱 맞추면 가장자리 장소가 매번 들락거린다.
  return Math.max(1000, Math.round(offset + radiusFromMap(map)));
}

const CLIENT_CACHE_TTL = 30 * 60 * 1000; // 30분 클라이언트 인메모리 캐시 (화면 재방문 시 0ms 즉시 로드)
const clientPlaceCache = new Map<string, { expiresAt: number; items: any[] }>();
const clientHeatCache = new Map<
  string,
  { expiresAt: number; spots: any[]; days: HeatDay[] }
>();

/** 지도 장소 목록 및 온기 데이터 실시간 동기화 훅 */
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

    // 1. 실시간 권역별 혼잡도 및 관광객 집중도 히트스팟 패치 (클라이언트 캐시 우선)
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

    // 2. 온기 이야기 API 실시간 연동
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
        const items: Item[] = Array.isArray(json.items) ? json.items : [];
        log.log('items', items.length, `${Math.round(performance.now() - t0)}ms`, json.error ?? '');

        const failed = !res.ok || Boolean(json.error);

        /*
          실패한 응답으로 화면을 덮지 않는다.

          장소 조회는 확대할 때마다 다시 나간다(level이 의존성에 있다). 그런데 예전에는
          실패든 성공이든 받은 그대로 setItems를 불러서, 한 번 타임아웃이 나면 핀이
          통째로 사라졌다 — '확대하면 핀이 사라진다'가 이것이다.
          게다가 그 빈 결과를 30분 캐시에 굳혀서 그 동네가 계속 비어 보였다.

          실패는 캐시하지 않고, 이전에 보던 장소를 그대로 둔다.
          진짜로 없는 지역은 성공 응답의 빈 배열로 오므로 정상적으로 비워진다.
        */
        if (!failed) {
          clientPlaceCache.set(cacheKey, {
            expiresAt: Date.now() + CLIENT_CACHE_TTL,
            items,
          });

          // 외부 URL 파라미터나 사용자가 선택한 타겟 상세 항목이 새 API 응답에 없어도 유실되지 않도록 보존
          const currentDetailId = useMapStore.getState().detailId;
          const currentItems = useMapStore.getState().items;
          const targetItem = currentItems.find((it) => it.id === currentDetailId);
          const nextItems =
            targetItem && !items.some((it) => it.id === targetItem.id)
              ? [targetItem, ...items]
              : items;

          setItems(nextItems);
        } else if (items.length > 0) {
          // 관광공사가 죽었을 때 서버가 내어주는 저장된 한옥. 보여는 주되 캐시에는 넣지 않는다.
          const currentDetailId = useMapStore.getState().detailId;
          const currentItems = useMapStore.getState().items;
          const targetItem = currentItems.find((it) => it.id === currentDetailId);
          const nextItems =
            targetItem && !items.some((it) => it.id === targetItem.id)
              ? [targetItem, ...items]
              : items;

          setItems(nextItems);
        }

        // 오디 도슨트 해설 데이터 동기화
        useSorimaruAudioStore
          .getState()
          .fetchRegionalSorimaruStories(searchCenter.lng, searchCenter.lat);

        if (!res.ok || json.error) {
          setError(typeof json.error === 'string' ? json.error : '장소를 불러오지 못했습니다');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        log.error('fetch 실패', err);
        // 네트워크가 끊겨도 보던 장소는 남긴다. 위와 같은 이유다.
        setError(err instanceof Error ? err.message : '장소를 불러오지 못했습니다');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [map, mode, category, searchCenter.lat, searchCenter.lng, level, reloadNonce]);
}
