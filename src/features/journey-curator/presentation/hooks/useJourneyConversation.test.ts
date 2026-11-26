// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConversationRepository } from '../../application/conversationRepository';
import type { RunAccepted } from '../../api/journeyApi';
import type { JourneyRunSnapshot, JourneySseFrame } from '../../api/journeyContract';
import { useJourneyConversation } from './useJourneyConversation';

const ACCEPTED: RunAccepted = {
  schemaVersion: '1.3',
  explorationId: 'exp-1',
  runId: 'run-1',
  stateVersion: 1,
  runUrl: '/api/v1/explorations/exp-1/runs/run-1',
  eventsUrl: '/api/v1/explorations/exp-1/runs/run-1/events',
  snapshotUrl: '/api/v1/explorations/exp-1',
};

function runSnapshot(overrides: Partial<JourneyRunSnapshot>): JourneyRunSnapshot {
  return {
    schemaVersion: '1.3',
    runId: 'run-1',
    status: 'RUNNING',
    engine: 'LLM',
    degradedReason: null,
    stage: null,
    sequence: 0,
    outcome: null,
    clarification: null,
    retryAfterMs: 0,
    createdAt: '2026-11-25T00:00:00Z',
    startedAt: '2026-11-25T00:00:00Z',
    deadlineAt: '2026-11-25T00:01:00Z',
    error: null,
    ...overrides,
  };
}

const conversationSnapshot = {
  schemaVersion: '1.3',
  explorationId: 'exp-1',
  stateVersion: 1,
  board: null,
  pinnedRefs: [],
  excludedRefs: [],
  unavailableRefs: [],
  latestRun: null,
  pendingProposal: null,
  updatedAt: '2026-11-25T00:00:00Z',
};

function createFakeRepository(runs: JourneyRunSnapshot[]) {
  let subscriber: { onEvent: (frame: JourneySseFrame) => void; onError: (error: unknown) => void } | null = null;
  const closeSpy = vi.fn();
  let lastRun: JourneyRunSnapshot = runSnapshot({});
  const getAcceptedSnapshots = vi.fn(async () => {
    lastRun = runs.length > 1 ? (runs.shift() as JourneyRunSnapshot) : (runs[0] ?? runSnapshot({}));
    return { run: lastRun, snapshot: { ...conversationSnapshot, latestRun: lastRun } };
  });
  const repository = {
    listExplorations: vi.fn(async () => ({ schemaVersion: '1.3', items: [], totalCount: 0, nextCursor: null, hasMore: false })),
    getExploration: vi.fn(async () => ({ ...conversationSnapshot, latestRun: lastRun })),
    listTurns: vi.fn(async () => ({ schemaVersion: '1.3', items: [], nextCursor: null, hasMore: false })),
    createExploration: vi.fn(async () => ACCEPTED),
    createTurn: vi.fn(async () => ACCEPTED),
    getAcceptedSnapshots,
    subscribeToRunEvents: vi.fn((_url: string, onEvent: (frame: JourneySseFrame) => void, onError: (error: unknown) => void) => {
      subscriber = { onEvent, onError };
      return closeSpy;
    }),
    cancelRun: vi.fn(),
    deleteExploration: vi.fn(),
  } as unknown as ConversationRepository & { getAcceptedSnapshots: typeof getAcceptedSnapshots };
  return {
    repository,
    closeSpy,
    getAcceptedSnapshots,
    emit: (frame: JourneySseFrame) => {
      act(() => subscriber?.onEvent(frame));
    },
    fail: () => {
      act(() => subscriber?.onError(new Event('error')));
    },
  };
}

describe('useJourneyConversation progress timeline', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds steps from stage frames and collapses them when the run terminates', async () => {
    const fake = createFakeRepository([
      runSnapshot({ status: 'RUNNING', stage: null, sequence: 0 }),
      runSnapshot({ status: 'COMPLETED', stage: 'VALIDATING', sequence: 4, outcome: 'INITIAL_BOARD', engine: 'LLM' }),
    ]);
    const { result } = renderHook(() => useJourneyConversation(null, fake.repository));

    await act(async () => {
      await result.current.startConversation('서울 궁궐 추천');
    });
    await waitFor(() => expect(result.current.progress?.runId).toBe('run-1'));

    fake.emit({ id: '1', event: 'run.stage', data: { schemaVersion: '1.3', runId: 'run-1', sequence: 1, status: 'RUNNING', stage: 'RETRIEVING' } });
    expect(result.current.progress?.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'active' },
    ]);

    // 뒤늦게 도착한 이전 단계 프레임은 화면을 되돌리지 않는다.
    fake.emit({ id: '2', event: 'run.stage', data: { schemaVersion: '1.3', runId: 'run-1', sequence: 1, status: 'RUNNING', stage: 'INTERPRETING' } });
    expect(result.current.progress?.currentStage).toBe('RETRIEVING');

    fake.emit({ id: '3', event: 'run.terminal', data: { schemaVersion: '1.3', runId: 'run-1', sequence: 5, status: 'COMPLETED', outcome: 'INITIAL_BOARD' } });
    await waitFor(() => expect(result.current.progress?.finished).toBe(true));
    expect(result.current.progress?.collapsed).toBe(true);
    expect(result.current.progress?.steps.every((step) => step.state === 'done')).toBe(true);
    expect(result.current.progress?.engine).toBe('LLM');
  });

  it('re-reads the run snapshot when the stream stays down past the fallback window', async () => {
    vi.useFakeTimers();
    const fake = createFakeRepository([
      runSnapshot({ status: 'RUNNING', stage: 'RETRIEVING', sequence: 2 }),
      runSnapshot({ status: 'RUNNING', stage: 'GENERATING', sequence: 3 }),
    ]);
    const { result } = renderHook(() => useJourneyConversation(null, fake.repository));

    await act(async () => {
      await result.current.startConversation('서울 궁궐 추천');
    });
    expect(result.current.progress?.currentStage).toBe('RETRIEVING');

    fake.fail();
    expect(result.current.progress?.reconnecting).toBe(true);
    expect(fake.getAcceptedSnapshots).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(fake.getAcceptedSnapshots).toHaveBeenCalledTimes(2);
    expect(result.current.progress?.currentStage).toBe('GENERATING');
    expect(result.current.progress?.reconnecting).toBe(false);
  });

  it('keeps the stream open on heartbeat without moving the timeline', async () => {
    const fake = createFakeRepository([runSnapshot({ status: 'RUNNING', stage: 'RETRIEVING', sequence: 2 })]);
    const { result } = renderHook(() => useJourneyConversation(null, fake.repository));

    await act(async () => {
      await result.current.startConversation('서울 궁궐 추천');
    });
    const before = result.current.progress?.lastSignalAt;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    fake.emit({ id: '9', event: 'heartbeat', data: { schemaVersion: '1.3', runId: 'run-1', sequence: 2 } });

    expect(result.current.progress?.currentStage).toBe('RETRIEVING');
    expect(result.current.progress?.lastSignalAt).toBeGreaterThan(before ?? 0);
    expect(fake.closeSpy).not.toHaveBeenCalled();
  });

  it('shows the candidate count carried by a completed SEARCH item', async () => {
    const fake = createFakeRepository([runSnapshot({ status: 'RUNNING', stage: 'RETRIEVING', sequence: 2 })]);
    const { result } = renderHook(() => useJourneyConversation(null, fake.repository));

    await act(async () => {
      await result.current.startConversation('서울 궁궐 추천');
    });
    fake.emit({ id: '3', event: 'run.item.started', data: { schemaVersion: '1.4', runId: 'run-1', sequence: 3, itemId: 'SEARCH-3' } } as never);
    fake.emit({
      id: '4',
      event: 'run.item.completed',
      data: { schemaVersion: '1.4', runId: 'run-1', sequence: 4, itemId: 'SEARCH-3', status: 'DONE', detail: { count: 12 } },
    } as never);

    expect(result.current.progress?.steps.find((step) => step.stage === 'RETRIEVING')).toEqual({ stage: 'RETRIEVING', state: 'done', count: 12 });
  });
});
