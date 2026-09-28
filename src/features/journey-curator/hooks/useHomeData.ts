'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isOnmaruApiError } from '@/lib/api/errors';
import { swrFetch, tabCache } from '@/lib/cache/tabMemoryCache';
import { CK, TTL_MS } from '@/lib/cache/cacheKeys';
import {
  homeRepository,
  type CuratedCourse,
  type PopularRegion,
  type TrendingSound,
  type PopularSound,
} from '../api/homeApi';

type LoadState<T> = {
  data: T[];
  loading: boolean;
  revalidating: boolean;
  failed: boolean;
  unavailable: boolean;
};

function useHomeList<T>(
  key: string,
  fetcher: () => Promise<{ items: T[] }>,
  ttlMs: number,
): LoadState<T> & { retry: () => void } {
  const [requestNumber, setRequestNumber] = useState(0);
  const [state, setState] = useState<LoadState<T>>({
    data: [],
    loading: true,
    revalidating: false,
    failed: false,
    unavailable: false,
  });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setState((s) => ({ ...s, loading: true, failed: false, unavailable: false }));

    swrFetch(key, fetcher, ttlMs, {
      onRevalidate: (fresh) => {
        if (!cancelledRef.current) {
          if (!Array.isArray((fresh as { items: T[] }).items)) return;
          setState({ data: (fresh as { items: T[] }).items, loading: false, revalidating: false, failed: false, unavailable: false });
        }
      },
      onRevalidateError: () => {
        if (!cancelledRef.current) setState((s) => ({ ...s, revalidating: false }));
      },
    })
      .then((result) => {
        if (cancelledRef.current) return;
        const page = result.value;
        if (!Array.isArray(page.items)) throw new Error('홈 목록 응답에 items 배열이 없습니다.');
        setState({ data: page.items, loading: false, revalidating: result.wasStale, failed: false, unavailable: false });
      })
      .catch((error: unknown) => {
        if (!cancelledRef.current) {
          setState({ data: [], loading: false, revalidating: false, failed: true, unavailable: isOnmaruApiError(error) && error.status === 503 });
        }
      });

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlMs, requestNumber]);

  return {
    ...state,
    retry: useCallback(() => {
      tabCache.delete(key);
      setState((current) => ({ ...current, loading: true, revalidating: false, failed: false, unavailable: false }));
      setRequestNumber((current) => current + 1);
    }, [key]),
  };
}

export function useCuratedCourses(category?: string) {
  const key = CK.homeCuratedCourses(category);
  const fetcher = useCallback(() => homeRepository.listCuratedCourses(category), [category]);
  return useHomeList<CuratedCourse>(key, fetcher, TTL_MS.HOME_CURATED);
}

export function useTrendingSounds() {
  return useHomeList<TrendingSound>(
    CK.homeTrendingSounds(),
    () => homeRepository.listTrendingSounds(),
    TTL_MS.HOME_POPULAR,
  );
}

export function usePopularSounds() {
  return useHomeList<PopularSound>(
    CK.homePopularSounds(),
    () => homeRepository.listPopularSounds({ limit: 7 }),
    TTL_MS.HOME_POPULAR,
  );
}

export function usePopularRegions() {
  return useHomeList<PopularRegion>(
    CK.homePopularRegions(),
    () => homeRepository.listPopularRegions(),
    TTL_MS.HOME_POPULAR,
  );
}
