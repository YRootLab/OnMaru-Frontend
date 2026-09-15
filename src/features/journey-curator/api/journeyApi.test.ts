import { describe, expect, it } from 'vitest';
import { createJourneyRepository } from './journeyApi';

describe('journey repository', () => {
  it('starts and recovers journey runs through the backend contract paths', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createJourneyRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      if (path === '/explorations') {
        return {
          schemaVersion: '1.2',
          explorationId: 'exp-1',
          runId: 'run-1',
          stateVersion: 0,
          runUrl: '/explorations/exp-1/runs/run-1',
          eventsUrl: '/explorations/exp-1/runs/run-1/events',
          snapshotUrl: '/explorations/exp-1',
        };
      }
      return { schemaVersion: '1.2', id: 'snapshot-1' };
    }) as never);

    await repository.start({ query: '전주 한옥', idempotencyKey: 'key-1' });
    await repository.getExploration('exp-1');
    await repository.getRun('exp-1', 'run-1');

    expect(calls).toEqual([
      {
        path: '/explorations',
        options: {
          method: 'POST',
          body: { query: '전주 한옥', locale: 'ko-KR' },
          csrf: true,
          idempotencyKey: 'key-1',
        },
      },
      { path: '/explorations/exp-1', options: { method: 'GET', cache: 'no-store' } },
      { path: '/explorations/exp-1/runs/run-1', options: { method: 'GET', cache: 'no-store' } },
    ]);
  });
});
