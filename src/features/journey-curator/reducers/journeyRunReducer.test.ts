import { describe, expect, it } from 'vitest';
import { parseJourneySseFrame } from './journeySseParser';
import {
  createInitialJourneyRunState,
  reduceJourneyRunState,
  shouldRecoverJourneySnapshot,
} from './journeyRunReducer';

describe('journey run reducer', () => {
  it('ignores duplicate and out-of-order replay events', () => {
    const newer = parseJourneySseFrame({
      id: '2',
      event: 'run.stage',
      data: JSON.stringify({ schemaVersion: '1.3', runId: '00000000-0000-4000-8000-0000-000000000001', sequence: 2, status: 'RUNNING', stage: 'GENERATING' }),
    });
    const older = parseJourneySseFrame({
      id: '1',
      event: 'run.stage',
      data: JSON.stringify({ schemaVersion: '1.3', runId: '00000000-0000-4000-8000-0000-000000000001', sequence: 1, status: 'RUNNING', stage: 'RETRIEVING' }),
    });

    expect(newer).not.toBeNull();
    expect(older).not.toBeNull();

    const afterNewer = reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame: newer! });
    const afterOlder = reduceJourneyRunState(afterNewer, { type: 'sse-frame', frame: older! });

    expect(afterOlder).toBe(afterNewer);
    expect(afterOlder.latestSequence).toBe(2);
  });

  it('ignores an unsupported SSE event without interrupting the run', () => {
    const frame = parseJourneySseFrame({
      id: '3',
      event: 'run.future_event',
      data: JSON.stringify({ schemaVersion: '1.3', runId: '00000000-0000-4000-8000-0000-000000000002' }),
    });

    expect(frame).toBeNull();
  });

  it('parses terminal frames without treating them as renderable board data', () => {
    const frame = parseJourneySseFrame({
      id: '2',
      event: 'run.terminal',
      data: JSON.stringify({
        schemaVersion: '1.2',
        runId: '00000000-0000-4000-8000-000000000002',
        sequence: 2,
        status: 'COMPLETED',
        outcome: 'INITIAL_BOARD',
      }),
    });

    const state = reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame: frame! });

    expect(state.connection.status).toBe('terminal');
    expect(state.renderSource).toBe('snapshot');
    expect(shouldRecoverJourneySnapshot(state)).toBe(true);
  });

  it('marks reset frames as requiring snapshot recovery', () => {
    const frame = parseJourneySseFrame({
      event: 'reset',
      data: JSON.stringify({ schemaVersion: '1.2', runId: '00000000-0000-4000-8000-000000000002' }),
    });

    const state = reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame: frame! });

    expect(state.connection.status).toBe('reset');
    expect(shouldRecoverJourneySnapshot(state)).toBe(true);
  });

  it('renders baseline as a basic exploration result label after snapshot sync', () => {
    const state = reduceJourneyRunState(createInitialJourneyRunState(), {
      type: 'snapshot-synced',
      run: {
        schemaVersion: '1.2',
        runId: '00000000-0000-4000-8000-000000000003',
        status: 'COMPLETED',
        engine: 'BASELINE',
        degradedReason: 'AI_TIMEOUT',
        stage: null,
        sequence: 1,
        outcome: 'INITIAL_BOARD',
        clarification: null,
        retryAfterMs: 0,
        createdAt: '2026-09-14T00:00:00.000Z',
        startedAt: '2026-09-14T00:00:01.000Z',
        deadlineAt: '2026-09-14T00:00:20.000Z',
        error: null,
      },
    });

    expect(state.view).toBe('baselineReady');
    expect(state.badgeLabel).toBe('기본 탐색 결과');
  });
});
