import { describe, expect, it, vi } from 'vitest';
import { createAdminPipelineRepository } from './adminPipelineRepository';

describe('adminPipelineRepository', () => {
  it('reads the expanded status without replacing nullable fields with zeroes', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      schemaVersion: '1.1',
      dataset: 'kto-korean-tour',
      status: 'RUNNING',
      lastSuccessAt: null,
      failureCount: 1,
      cumulativeFailureRunCount: 9,
      lastRun: {
        runId: '00000000-0000-0000-0000-000000000668',
        dataset: 'kto-korean-tour',
        scope: 'ALL',
        status: 'RUNNING',
        progress: null,
        startedAt: '2026-10-06T06:00:03Z',
        finishedAt: null,
        durationSeconds: null,
        failureCount: 1,
      },
      contentStats: null,
      apiUsage: null,
    });
    const repository = createAdminPipelineRepository(fetcher);

    const status = await repository.getStatus();

    expect(status.lastSuccessAt).toBeNull();
    expect(status.lastRun?.durationSeconds).toBeNull();
    expect(status.contentStats).toBeNull();
    expect(status.apiUsage).toBeNull();
    expect(fetcher).toHaveBeenCalledWith(
      '/admin/pipelines/kto-korean-tour/status',
      { method: 'GET', cache: 'no-store' },
    );
  });

  it('forwards an opaque failure cursor unchanged', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      schemaVersion: '1.0', items: [], totalCount: 3, hasNext: false, nextCursor: null,
    });
    const repository = createAdminPipelineRepository(fetcher);
    const cursor = 'signed.cursor/+opaque==';

    await repository.getFailures('00000000-0000-0000-0000-000000000668', { limit: 20, cursor });

    expect(fetcher).toHaveBeenCalledWith(
      '/admin/pipelines/kto-korean-tour/runs/00000000-0000-0000-0000-000000000668/failures',
      { method: 'GET', cache: 'no-store', params: { limit: 20, cursor } },
    );
  });

  it('reads a run through the canonical dataset path', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      runId: '00000000-0000-0000-0000-000000000668', dataset: 'kto-korean-tour', scope: 'ALL',
      status: 'ABANDONED', progress: null, startedAt: null, finishedAt: null, durationSeconds: null,
      failureCount: 0,
    });
    const repository = createAdminPipelineRepository(fetcher);

    const run = await repository.getRun('00000000-0000-0000-0000-000000000668');

    expect(run.status).toBe('ABANDONED');
    expect(fetcher).toHaveBeenCalledWith(
      '/admin/pipelines/kto-korean-tour/runs/00000000-0000-0000-0000-000000000668',
      { method: 'GET', cache: 'no-store' },
    );
  });
});
