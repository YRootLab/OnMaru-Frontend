'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OnmaruApiError } from '@/lib/api/errors';
import { isOnmaruApiError } from '@/lib/api/errors';
import type {
  AdminPipelineFailure,
  AdminPipelineRun,
  AdminPipelineStatus,
} from '@/features/admin/domain/adminPipeline';
import {
  adminPipelineRepository,
  type AdminPipelineRepository,
} from '@/features/admin/infrastructure/adminPipelineRepository';

export function useAdminPipeline(repository: AdminPipelineRepository = adminPipelineRepository) {
  const [status, setStatus] = useState<AdminPipelineStatus | null>(null);
  const [run, setRun] = useState<AdminPipelineRun | null>(null);
  const [failures, setFailures] = useState<AdminPipelineFailure[]>([]);
  const [failureTotalCount, setFailureTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextFailures, setHasNextFailures] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<OnmaruApiError | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async (initial: boolean) => {
    const requestId = ++requestIdRef.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      let latestStatus = await repository.getStatus();
      let latestRun: AdminPipelineRun | null = null;

      if (latestStatus.lastRun) {
        try {
          latestRun = await repository.getRun(latestStatus.lastRun.runId);
        } catch (runError) {
          if (!isOnmaruApiError(runError) || runError.status !== 404) throw runError;
          latestStatus = await repository.getStatus();
          latestRun = latestStatus.lastRun;
        }
      }

      let nextFailures: AdminPipelineFailure[] = [];
      let totalCount = 0;
      let hasNext = false;
      let cursor: string | null = null;
      let failureDetailError: OnmaruApiError | null = null;
      if (latestRun && latestRun.failureCount > 0) {
        totalCount = latestRun.failureCount;
        try {
          const page = await repository.getFailures(latestRun.runId, { limit: 20 });
          nextFailures = page.items;
          totalCount = page.totalCount;
          hasNext = page.hasNext;
          cursor = page.nextCursor;
        } catch (failureError) {
          failureDetailError = isOnmaruApiError(failureError) ? failureError : {
            status: 500,
            code: 'INTERNAL_ERROR',
            message: 'INTERNAL_ERROR',
            requestId: null,
            details: {},
            classification: 'SERVER_ERROR',
          };
        }
      }

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setStatus(latestStatus);
      setRun(latestRun);
      setFailures(nextFailures);
      setFailureTotalCount(totalCount);
      setHasNextFailures(hasNext);
      setNextCursor(cursor);
      setError(failureDetailError);
    } catch (loadError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(isOnmaruApiError(loadError) ? loadError : {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'INTERNAL_ERROR',
        requestId: null,
        details: {},
        classification: 'SERVER_ERROR',
      });
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [repository]);

  const refresh = useCallback(() => load(false), [load]);

  const loadMoreFailures = useCallback(async () => {
    if (!run || !hasNextFailures || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      let page;
      try {
        page = await repository.getFailures(run.runId, { limit: 20, cursor: nextCursor });
      } catch (pageError) {
        if (!isOnmaruApiError(pageError) || pageError.status !== 400) throw pageError;
        page = await repository.getFailures(run.runId, { limit: 20 });
        setFailures([]);
      }
      if (!mountedRef.current) return;
      setFailures((current) => {
        const unique = new Map(current.map((item) => [item.id, item]));
        page.items.forEach((item) => unique.set(item.id, item));
        return [...unique.values()];
      });
      setFailureTotalCount(page.totalCount);
      setHasNextFailures(page.hasNext);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      if (mountedRef.current && isOnmaruApiError(loadError)) setError(loadError);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [hasNextFailures, loadingMore, nextCursor, repository, run]);

  useEffect(() => {
    mountedRef.current = true;
    void load(true);
    const handleFocus = () => void load(false);
    window.addEventListener('focus', handleFocus);
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      window.removeEventListener('focus', handleFocus);
    };
  }, [load]);

  return {
    status,
    run,
    failures,
    failureTotalCount,
    hasNextFailures,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    loadMoreFailures,
  };
}
