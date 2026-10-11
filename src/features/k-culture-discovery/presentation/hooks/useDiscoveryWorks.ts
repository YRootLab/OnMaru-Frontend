import { useState, useEffect, useCallback } from 'react';
import { getDiscoveryWorks } from '../../application/useCases';
import type { WorkSummary, DiscoveryWorksParams, WorkType } from '../../domain/types';

export interface UseDiscoveryWorksOptions {
  type?: WorkType;
  q?: string;
  limit?: number;
}

export interface UseDiscoveryWorksResult {
  items: WorkSummary[];
  matchingCount: number;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useDiscoveryWorks(options: UseDiscoveryWorksOptions = {}): UseDiscoveryWorksResult {
  const { type, q, limit = 20 } = options;

  const [items, setItems] = useState<WorkSummary[]>([]);
  const [matchingCount, setMatchingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const params: DiscoveryWorksParams = { type, q, limit };
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setIsError(false);
    setItems([]);
    setNextCursor(null);

    getDiscoveryWorks({ type, q, limit })
      .then((page) => {
        if (!ignore) {
          setItems(page.items);
          setMatchingCount(page.matchingWorkCount);
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
    getDiscoveryWorks({ type, q, limit, cursor: nextCursor })
      .then((page) => {
        setItems((prev) => [...prev, ...page.items]);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, nextCursor, isLoading, paramsKey]);

  return { items, matchingCount, isLoading, isError, hasMore, loadMore };
}
