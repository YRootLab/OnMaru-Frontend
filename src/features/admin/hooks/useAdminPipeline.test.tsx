// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminPipelineRepository } from '@/features/admin/infrastructure/adminPipelineRepository';
import { useAdminPipeline } from './useAdminPipeline';

const run = {
  runId: '00000000-0000-0000-0000-000000000668',
  dataset: 'kto-korean-tour',
  scope: 'ALL' as const,
  status: 'SUCCEEDED' as const,
  progress: null,
  startedAt: '2026-10-06T04:00:00Z',
  finishedAt: '2026-10-06T04:05:32Z',
  durationSeconds: 332,
  failureCount: 2,
};

const status = {
  schemaVersion: '1.1',
  dataset: 'kto-korean-tour',
  status: 'SUCCEEDED' as const,
  lastSuccessAt: '2026-10-06T04:05:32Z',
  failureCount: 2,
  cumulativeFailureRunCount: 9,
  lastRun: run,
  contentStats: null,
  apiUsage: null,
};

function repository(overrides: Partial<AdminPipelineRepository> = {}): AdminPipelineRepository {
  return {
    getStatus: vi.fn().mockResolvedValue(status),
    getRun: vi.fn().mockResolvedValue(run),
    getFailures: vi.fn().mockResolvedValue({
      schemaVersion: '1.0',
      items: [{
        id: 'failure-1', occurredAt: '2026-10-06T04:02:11Z', endpoint: null, contentId: null,
        errorCode: 'UPSTREAM_TIMEOUT', message: 'TourAPI request timed out', retryable: true,
      }],
      totalCount: 2,
      hasNext: true,
      nextCursor: 'opaque-cursor',
    }),
    ...overrides,
  };
}

describe('useAdminPipeline', () => {
  it('loads status, latest run, and failures in contract order', async () => {
    const calls: string[] = [];
    const source = repository({
      getStatus: vi.fn(async () => { calls.push('status'); return status; }),
      getRun: vi.fn(async () => { calls.push('run'); return run; }),
      getFailures: vi.fn(async () => {
        calls.push('failures');
        return { schemaVersion: '1.0', items: [], totalCount: 2, hasNext: false, nextCursor: null };
      }),
    });

    const { result } = renderHook(() => useAdminPipeline(source));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(calls).toEqual(['status', 'run', 'failures']);
    expect(result.current.run?.durationSeconds).toBe(332);
  });

  it('forwards nextCursor and deduplicates appended failures', async () => {
    const getFailures = vi.fn()
      .mockResolvedValueOnce({
        schemaVersion: '1.0', items: [{
          id: 'failure-1', occurredAt: '2026-10-06T04:02:11Z', endpoint: null, contentId: null,
          errorCode: 'ONE', message: 'one', retryable: true,
        }], totalCount: 2, hasNext: true, nextCursor: 'opaque-cursor',
      })
      .mockResolvedValueOnce({
        schemaVersion: '1.0', items: [
          { id: 'failure-1', occurredAt: '2026-10-06T04:02:11Z', endpoint: null, contentId: null, errorCode: 'ONE', message: 'one', retryable: true },
          { id: 'failure-2', occurredAt: '2026-10-06T04:01:11Z', endpoint: 'detail', contentId: '42', errorCode: 'TWO', message: 'two', retryable: false },
        ], totalCount: 2, hasNext: false, nextCursor: null,
      });
    const source = repository({ getFailures });
    const { result } = renderHook(() => useAdminPipeline(source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.loadMoreFailures());

    expect(getFailures).toHaveBeenLastCalledWith(run.runId, { limit: 20, cursor: 'opaque-cursor' });
    expect(result.current.failures.map((item) => item.id)).toEqual(['failure-1', 'failure-2']);
  });

  it('refreshes with GET data when the window regains focus', async () => {
    const source = repository();
    const { result } = renderHook(() => useAdminPipeline(source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => window.dispatchEvent(new Event('focus')));

    await waitFor(() => expect(source.getStatus).toHaveBeenCalledTimes(2));
  });

  it('keeps the run summary visible when only failure details fail', async () => {
    const source = repository({
      getFailures: vi.fn().mockRejectedValue({
        status: 500,
        code: 'FAILURE_LOG_UNAVAILABLE',
        message: 'FAILURE_LOG_UNAVAILABLE',
        requestId: 'request-668',
        details: {},
        classification: 'SERVER_ERROR',
      }),
    });

    const { result } = renderHook(() => useAdminPipeline(source));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.status).toEqual(status);
    expect(result.current.run).toEqual(run);
    expect(result.current.failureTotalCount).toBe(2);
    expect(result.current.failures).toEqual([]);
    expect(result.current.error?.requestId).toBe('request-668');
  });

  it('discards an invalid cursor and reloads the first failure page', async () => {
    const cursorError = {
      status: 400,
      code: 'INVALID_CURSOR',
      message: 'INVALID_CURSOR',
      requestId: 'request-cursor',
      details: {},
      classification: 'CLIENT_ERROR' as const,
    };
    const getFailures = vi.fn()
      .mockResolvedValueOnce({
        schemaVersion: '1.0',
        items: [{ id: 'stale', occurredAt: '2026-10-06T04:02:11Z', endpoint: null, contentId: null, errorCode: 'OLD', message: 'old', retryable: false }],
        totalCount: 2,
        hasNext: true,
        nextCursor: 'expired-cursor',
      })
      .mockRejectedValueOnce(cursorError)
      .mockResolvedValueOnce({
        schemaVersion: '1.0',
        items: [{ id: 'fresh', occurredAt: '2026-10-06T04:03:11Z', endpoint: null, contentId: null, errorCode: 'NEW', message: 'new', retryable: true }],
        totalCount: 1,
        hasNext: false,
        nextCursor: null,
      });
    const source = repository({ getFailures });
    const { result } = renderHook(() => useAdminPipeline(source));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.loadMoreFailures());

    expect(getFailures).toHaveBeenNthCalledWith(2, run.runId, { limit: 20, cursor: 'expired-cursor' });
    expect(getFailures).toHaveBeenNthCalledWith(3, run.runId, { limit: 20 });
    expect(result.current.failures.map((item) => item.id)).toEqual(['fresh']);
  });

  it('refreshes status when the latest run id is no longer available', async () => {
    const replacementStatus = { ...status, status: 'RUNNING' as const, lastRun: { ...run, status: 'RUNNING' as const } };
    const source = repository({
      getStatus: vi.fn()
        .mockResolvedValueOnce(status)
        .mockResolvedValueOnce(replacementStatus),
      getRun: vi.fn().mockRejectedValue({
        status: 404,
        code: 'RUN_NOT_FOUND',
        message: 'RUN_NOT_FOUND',
        requestId: 'request-run',
        details: {},
        classification: 'CLIENT_ERROR',
      }),
    });

    const { result } = renderHook(() => useAdminPipeline(source));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(source.getStatus).toHaveBeenCalledTimes(2);
    expect(result.current.status).toEqual(replacementStatus);
    expect(result.current.run?.status).toBe('RUNNING');
  });
});
