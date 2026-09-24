'use client';

import { useCallback, useEffect, useState } from 'react';
import { isOnmaruApiError } from '@/lib/api/errors';
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
  failed: boolean;
  unavailable: boolean;
};

function useHomeList<T>(
  load: () => Promise<{ items: T[] }>,
): LoadState<T> & { retry: () => void } {
  const [requestNumber, setRequestNumber] = useState(0);
  const [state, setState] = useState<LoadState<T>>({
    data: [],
    loading: true,
    failed: false,
    unavailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    load()
      .then((page) => {
        if (!Array.isArray(page.items)) {
          throw new Error('홈 목록 응답에 items 배열이 없습니다.');
        }
        if (!cancelled) setState({ data: page.items, loading: false, failed: false, unavailable: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: [],
            loading: false,
            failed: true,
            unavailable: isOnmaruApiError(error) && error.status === 503,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [load, requestNumber]);

  return {
    ...state,
    retry: useCallback(() => {
      setState((current) => ({ ...current, loading: true, failed: false, unavailable: false }));
      setRequestNumber((current) => current + 1);
    }, []),
  };
}

const loadTrendingSounds = () => homeRepository.listTrendingSounds();
const loadPopularSounds = () => homeRepository.listPopularSounds({ limit: 7 });
const loadPopularRegions = () => homeRepository.listPopularRegions();

export function useCuratedCourses(category?: string) {
  const load = useCallback(() => homeRepository.listCuratedCourses(category), [category]);
  return useHomeList<CuratedCourse>(load);
}

export function useTrendingSounds() {
  return useHomeList<TrendingSound>(loadTrendingSounds);
}

export function usePopularSounds() {
  return useHomeList<PopularSound>(loadPopularSounds);
}

export function usePopularRegions() {
  return useHomeList<PopularRegion>(loadPopularRegions);
}
