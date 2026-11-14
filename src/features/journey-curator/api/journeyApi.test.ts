import { describe, expect, it, vi } from 'vitest';
import { createJourneyRepository } from './journeyApi';

describe('journey repository', () => {
  it('uses the RunAccepted snapshot URLs without rebuilding their paths', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createJourneyRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { schemaVersion: '1.3' };
    }) as never);

    await repository.getAcceptedSnapshots({
      schemaVersion: '1.3',
      explorationId: 'exp-1',
      runId: 'run-1',
      stateVersion: 0,
      runUrl: '/api/v1/explorations/exp-1/runs/run-1',
      eventsUrl: '/api/v1/explorations/exp-1/runs/run-1/events',
      snapshotUrl: '/api/v1/explorations/exp-1',
    });

    expect(calls).toEqual([
      { path: '/api/v1/explorations/exp-1/runs/run-1', options: { method: 'GET', cache: 'no-store', rootPath: true } },
      { path: '/api/v1/explorations/exp-1', options: { method: 'GET', cache: 'no-store', rootPath: true } },
    ]);
  });

  it('subscribes to the EventSource URL returned by RunAccepted without rebuilding it', () => {
    const createEventSource = vi.fn(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    })) as unknown as import('./journeyApi').JourneyEventSourceFactory;
    const repository = createJourneyRepository();

    repository.subscribeToRunEvents(
      'https://journey.example.test/signed-events?run=accepted',
      vi.fn(),
      { createEventSource },
    );

    expect(createEventSource).toHaveBeenCalledWith('https://journey.example.test/signed-events?run=accepted');
  });

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
