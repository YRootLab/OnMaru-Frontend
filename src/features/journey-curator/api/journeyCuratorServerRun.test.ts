import { describe, expect, it, vi } from 'vitest';
import { runJourneyCurator } from './journeyCuratorApi';
import { JOURNEY_PLANS } from '../data/curatedJourneys';
import type { JourneyRepository } from './journeyApi';

describe('runJourneyCurator', () => {
  it('uses the backend journey repository and returns the authoritative snapshot board', async () => {
    const repository: JourneyRepository = {
      start: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        explorationId: 'exp-1',
        runId: 'run-1',
        stateVersion: 1,
        runUrl: '/explorations/exp-1/runs/run-1',
        eventsUrl: '/explorations/exp-1/runs/run-1/events',
        snapshotUrl: '/explorations/exp-1',
      }),
      submitTurn: vi.fn(),
      getRun: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        runId: 'run-1',
        status: 'COMPLETED',
        engine: 'BASELINE',
        degradedReason: null,
        stage: null,
        outcome: 'INITIAL_BOARD',
        clarification: null,
        retryAfterMs: 0,
        createdAt: '2026-09-15T00:00:00.000Z',
        startedAt: '2026-09-15T00:00:01.000Z',
        deadlineAt: '2026-09-15T00:00:20.000Z',
        error: null,
      }),
      getExploration: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        id: 'exp-1',
        stateVersion: 2,
        board: JOURNEY_PLANS.story,
        pendingProposal: null,
        latestRun: null,
        execution: null,
      }),
      cancelRun: vi.fn(),
    };

    await expect(runJourneyCurator({ query: '안동 서원 이야기' }, { repository })).resolves.toMatchObject({
      plan: JOURNEY_PLANS.story,
      explorationId: 'exp-1',
      stateVersion: 2,
    });
    expect(repository.start).toHaveBeenCalledWith(expect.objectContaining({ query: '안동 서원 이야기' }));
    expect(repository.getRun).toHaveBeenCalledWith('exp-1', 'run-1');
    expect(repository.getExploration).toHaveBeenCalledWith('exp-1');
  });
});
