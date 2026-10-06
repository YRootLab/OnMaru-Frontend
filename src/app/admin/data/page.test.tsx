// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDataPipelinePage from './page';

const refresh = vi.fn();

vi.mock('@/features/admin/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({ isAdmin: true }),
}));

vi.mock('@/features/admin/hooks/useAdminPipeline', () => ({
  useAdminPipeline: () => ({
    status: {
      schemaVersion: '1.1', dataset: 'kto-korean-tour', status: 'SUCCEEDED',
      lastSuccessAt: '2026-10-06T04:05:32Z', failureCount: 2, cumulativeFailureRunCount: 9,
      lastRun: {
        runId: 'run-668', dataset: 'kto-korean-tour', scope: 'ALL', status: 'SUCCEEDED',
        progress: null, startedAt: '2026-10-06T04:00:00Z', finishedAt: '2026-10-06T04:05:32Z',
        durationSeconds: 332, failureCount: 2,
      },
      contentStats: null, apiUsage: null,
    },
    run: {
      runId: 'run-668', dataset: 'kto-korean-tour', scope: 'ALL', status: 'SUCCEEDED',
      progress: null, startedAt: '2026-10-06T04:00:00Z', finishedAt: '2026-10-06T04:05:32Z',
      durationSeconds: 332, failureCount: 2,
    },
    failures: [], failureTotalCount: 2, hasNextFailures: false,
    loading: false, refreshing: false, loadingMore: false, error: null,
    refresh, loadMoreFailures: vi.fn(),
  }),
}));

describe('AdminDataPipelinePage', () => {
  beforeEach(() => refresh.mockClear());
  afterEach(cleanup);

  it('is read-only and refreshes status without exposing manual collection controls', () => {
    render(<AdminDataPipelinePage />);

    expect(screen.queryByText('전체 빌드')).toBeNull();
    expect(screen.queryByText('지금 갱신하기')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '상태 새로고침' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('renders nullable backend sections as pending measurement instead of zero', () => {
    render(<AdminDataPipelinePage />);

    expect(screen.getByText('집계 준비 중')).toBeTruthy();
    expect(screen.getByText('계측 준비 중')).toBeTruthy();
    expect(screen.getByText('5분 32초')).toBeTruthy();
    expect(screen.getByText('누적 실패 실행 9회')).toBeTruthy();
  });
});
