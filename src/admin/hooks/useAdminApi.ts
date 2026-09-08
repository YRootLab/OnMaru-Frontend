'use client';

// ============================================================
// 관리자 데이터 통신 훅 (src/admin/hooks/useAdminApi.ts)
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';
import { ApiError } from '@/admin/types';

interface UseApiQueryOptions<T> {
  initialData?: T;
  autoFetch?: boolean;
  params?: Record<string, unknown>;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export function useAdminQuery<T>(path: string, options: UseApiQueryOptions<T> = {}) {
  const { initialData, autoFetch = true, params, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (customParams?: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = customParams ?? params;
        const res = await apiGet<T>(path, queryParams);
        setData(res);
        onSuccess?.(res);
        return res;
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        setError(apiErr);
        onError?.(apiErr);
        throw apiErr;
      } finally {
        setIsLoading(false);
      }
    },
    [path, params, onSuccess, onError]
  );

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, [autoFetch, execute]);

  return {
    data,
    setData,
    isLoading,
    error,
    refetch: execute,
  };
}

export function useAdminMutation<TResponse, TVariables = unknown>() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const post = useCallback(async (path: string, body?: TVariables): Promise<TResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiPost<TResponse>(path, body);
      return res;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr);
      throw apiErr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const patch = useCallback(async (path: string, body?: TVariables): Promise<TResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiPatch<TResponse>(path, body);
      return res;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr);
      throw apiErr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const del = useCallback(async (path: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiDelete(path);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr);
      throw apiErr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    post,
    patch,
    del,
    isLoading,
    error,
  };
}
