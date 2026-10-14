import { useState, useEffect, useCallback } from 'react';
import { getDiscoveryPlaces } from '../../application/useCases';
import { isOnmaruApiError } from '@/lib/api/errors';
import type {
  DiscoveryPlaceSummary,
  DiscoveryFacets,
  DiscoveryPlacesParams,
  TopicCode,
} from '../../domain/types';

export interface UseDiscoveryPlacesOptions {
  topic?: TopicCode;
  regionCode?: string;
  placeRole?: string;
  workId?: string;
  limit?: number;
}

export interface UseDiscoveryPlacesResult {
  items: DiscoveryPlaceSummary[];
  facets: DiscoveryFacets | null;
  matchingCount: number;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

function isCursorError(err: unknown): boolean {
  if (!isOnmaruApiError(err)) return false;
  return (
    err.code === 'CURSOR_INVALID' ||
    err.code === 'CURSOR_EXPIRED' ||
    err.status === 410
  );
}

export function useDiscoveryPlaces(options: UseDiscoveryPlacesOptions = {}): UseDiscoveryPlacesResult {
  const { topic, regionCode, placeRole, workId, limit = 20 } = options;

  const [items, setItems] = useState<DiscoveryPlaceSummary[]>([]);
  const [facets, setFacets] = useState<DiscoveryFacets | null>(null);
  const [matchingCount, setMatchingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const params: DiscoveryPlacesParams = { topic, regionCode, placeRole, workId, limit };
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setIsError(false);
    setItems([]);
    setNextCursor(null);

    getDiscoveryPlaces({ topic, regionCode, placeRole, workId, limit })
      .then((page) => {
        if (!ignore) {
          setItems(page.items);
          setFacets(page.facets);
          setMatchingCount(page.matchingPlaceCount);
          setHasMore(page.hasMore);
          setNextCursor(page.nextCursor);
        }
      })
      .catch(() => {
        if (!ignore) setIsError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isLoading) return;

    setIsLoading(true);
    getDiscoveryPlaces({ topic, regionCode, placeRole, workId, limit, cursor: nextCursor })
      .then((page) => {
        setItems((prev) => [...prev, ...page.items]);
        setFacets(page.facets);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => {
        if (isCursorError(err)) {
          // CURSOR_INVALID / CURSOR_EXPIRED: 커서 버리고 처음부터 재조회
          setNextCursor(null);
          setItems([]);
          getDiscoveryPlaces({ topic, regionCode, placeRole, workId, limit })
            .then((page) => {
              setItems(page.items);
              setFacets(page.facets);
              setMatchingCount(page.matchingPlaceCount);
              setHasMore(page.hasMore);
              setNextCursor(page.nextCursor);
            })
            .catch(() => setIsError(true))
            .finally(() => setIsLoading(false));
          return;
        }
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, nextCursor, isLoading, paramsKey]);

  return { items, facets, matchingCount, isLoading, isError, hasMore, loadMore };
}
