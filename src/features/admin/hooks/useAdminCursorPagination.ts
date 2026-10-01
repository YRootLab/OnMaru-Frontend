'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ApiError, CursorPageResponse } from '@/features/admin/types';

export interface UseAdminCursorPaginationOptions<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>> {
  fetchFn: (params: TFilter & { limit: number; cursor?: string }) => Promise<CursorPageResponse<TItem>>;
  filters?: TFilter;
  limit?: number; // default 20
  autoFetch?: boolean; // default true
  onError?: (error: ApiError) => void;
  onSuccess?: (data: CursorPageResponse<TItem>) => void;
}

export function useAdminCursorPagination<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>>(
  options: UseAdminCursorPaginationOptions<TItem, TFilter>
) {
  const {
    fetchFn,
    filters = {} as TFilter,
    limit = 20,
    autoFetch = true,
    onError,
    onSuccess,
  } = options;

  const validLimit = Math.max(1, Math.min(100, limit));

  const [items, setItems] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [cursorErrorOccurred, setCursorErrorOccurred] = useState<boolean>(false);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Stack of cursors: index 0 is undefined (page 1), index 1 is page 2's cursor, etc.
  const cursorHistoryRef = useRef<(string | undefined)[]>([undefined]);
  // Sequence counter to prevent race conditions / stale responses from overwriting current state
  const requestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeFetch = useCallback(
    async (cursor: string | undefined, targetPageIndex: number) => {
      const currentReqId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      setCursorErrorOccurred(false);

      try {
        const queryParams = {
          ...filtersRef.current,
          limit: validLimit,
          ...(cursor ? { cursor } : {}),
        };

        const res = await fetchFnRef.current(queryParams);

        if (!isMountedRef.current || currentReqId !== requestIdRef.current) {
          // Late response arrived — drop it!
          return;
        }

        const isNextAvailable = Boolean(res.hasNext ?? res.hasMore);
        const resolvedNextCursor = isNextAvailable ? (res.nextCursor ?? null) : null;

        setItems(res.items ?? []);
        setHasNext(isNextAvailable && Boolean(resolvedNextCursor));
        setNextCursor(resolvedNextCursor);
        setPageIndex(targetPageIndex);
        onSuccessRef.current?.(res);
      } catch (err: unknown) {
        if (!isMountedRef.current || currentReqId !== requestIdRef.current) {
          return;
        }

        const apiErr = err as ApiError;
        setError(apiErr);
        onErrorRef.current?.(apiErr);

        // Requirement 5: 만료·변조 cursor의 400 VALIDATION_ERROR 시 cursor 버리고 첫 페이지 재조회 흐름 제공
        const isValidationOrExpired =
          apiErr.status === 400 ||
          apiErr.status === 410 ||
          apiErr.code === 'VALIDATION_ERROR' ||
          apiErr.code === 'CURSOR_EXPIRED' ||
          apiErr.code === 'CURSOR_INVALID';

        if (cursor && isValidationOrExpired) {
          setCursorErrorOccurred(true);
          // Reset cursor history and automatically recover by refetching page 1
          cursorHistoryRef.current = [undefined];
          setPageIndex(0);
          void executeFetch(undefined, 0);
        }
      } finally {
        if (isMountedRef.current && currentReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [validLimit]
  );

  // When filters or limit change:
  // Reset cursor history and immediately refetch from page 1.
  const serializedFilters = JSON.stringify(filters) + `:${validLimit}`;
  const isFirstMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (autoFetch) {
        cursorHistoryRef.current = [undefined];
        setPageIndex(0);
        void executeFetch(undefined, 0);
      }
      return;
    }

    // Filter or limit changed: discard prior cursors & fetch page 1
    cursorHistoryRef.current = [undefined];
    setPageIndex(0);
    void executeFetch(undefined, 0);
  }, [serializedFilters, autoFetch, executeFetch]);

  const goToNextPage = useCallback(async () => {
    if (!hasNext || !nextCursor || isLoading) return;
    const nextIdx = pageIndex + 1;
    cursorHistoryRef.current[nextIdx] = nextCursor;
    await executeFetch(nextCursor, nextIdx);
  }, [hasNext, nextCursor, isLoading, pageIndex, executeFetch]);

  const goToPrevPage = useCallback(async () => {
    if (pageIndex <= 0 || isLoading) return;
    const prevIdx = pageIndex - 1;
    const prevCursor = cursorHistoryRef.current[prevIdx];
    await executeFetch(prevCursor, prevIdx);
  }, [pageIndex, isLoading, executeFetch]);

  const resetAndRefetch = useCallback(async () => {
    cursorHistoryRef.current = [undefined];
    setPageIndex(0);
    await executeFetch(undefined, 0);
  }, [executeFetch]);

  const refetchCurrentPage = useCallback(async () => {
    const currentCursor = cursorHistoryRef.current[pageIndex];
    await executeFetch(currentCursor, pageIndex);
  }, [pageIndex, executeFetch]);

  return {
    items,
    setItems,
    isLoading,
    error,
    pageIndex,
    pageNumber: pageIndex + 1,
    hasNext,
    hasPrev: pageIndex > 0,
    nextCursor,
    goToNextPage,
    goToPrevPage,
    resetAndRefetch,
    refetchCurrentPage,
    cursorErrorOccurred,
  };
}
