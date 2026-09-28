import { useEffect, useRef, useState } from 'react';
import type { Village } from '@/features/hanok-archive/types';
import { defaultHanokRepository } from '@/features/hanok-archive/api/hanokApi';
import type { BackendHanokListItem } from '@/features/hanok-archive/api/hanokApi';
import { swrFetch } from '@/lib/cache/tabMemoryCache';
import { TTL_MS } from '@/lib/cache/cacheKeys';

const SECTION1_CACHE_KEY = 'hanok:section1';
const SECTION1_LIMIT = 13;

function mapToVillage(item: BackendHanokListItem): Village {
  return {
    id: item.placeId,
    name: item.name,
    rawTitle: item.name,
    region: item.regionName,
    addr: '',
    lat: null,
    lng: null,
    type: item.category,
    badges: item.tags ?? [],
    image: item.thumbnailUrl,
    hasImage: item.thumbnailUrl !== null,
    summary: item.summary,
    overview: '',
  };
}

async function fetchSection1(): Promise<Village[]> {
  const result = await defaultHanokRepository.listHanoks({ hasImage: true, limit: SECTION1_LIMIT });
  return result.items.map(mapToVillage);
}

export type Section1State = {
  villages: Village[];
  loading: boolean;
  error: string | null;
};

export function useHanokSection1(): Section1State {
  const [state, setState] = useState<Section1State>({ villages: [], loading: true, error: null });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let active = true;

    swrFetch(SECTION1_CACHE_KEY, fetchSection1, TTL_MS.HOME_CURATED, {
      validate: (v) => Array.isArray(v) && v.length > 0,
      onRevalidate: (fresh) => {
        if (active) setState({ villages: fresh, loading: false, error: null });
      },
    })
      .then((result) => {
        if (active) setState({ villages: result.value, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active)
          setState({
            villages: [],
            loading: false,
            error: err instanceof Error ? err.message : '목록을 불러오지 못했습니다',
          });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
