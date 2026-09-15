import type { JourneyRunSnapshot, JourneySseFrame } from '../api/journeyContract';

export type JourneyRunView =
  | 'idle'
  | 'running'
  | 'clarificationRequired'
  | 'boardReady'
  | 'proposalReady'
  | 'baselineReady'
  | 'noResults'
  | 'failed'
  | 'cancelled';

export type JourneyRunUiState = {
  view: JourneyRunView;
  badgeLabel: string | null;
  renderSource: 'none' | 'snapshot';
  run: JourneyRunSnapshot | null;
  latestSequence: number | null;
  needsSnapshotRecovery: boolean;
  connection: {
    status: 'idle' | 'streaming' | 'heartbeat' | 'terminal' | 'reset';
    runId: string | null;
  };
};

export type JourneyRunUiEvent =
  | { type: 'sse-frame'; frame: JourneySseFrame }
  | { type: 'snapshot-synced'; run: JourneyRunSnapshot };

export function createInitialJourneyRunState(): JourneyRunUiState {
  return {
    view: 'idle',
    badgeLabel: null,
    renderSource: 'none',
    run: null,
    latestSequence: null,
    needsSnapshotRecovery: false,
    connection: { status: 'idle', runId: null },
  };
}

function viewFromSnapshot(run: JourneyRunSnapshot): JourneyRunView {
  if (run.status === 'FAILED') return 'failed';
  if (run.status === 'CANCELLED') return 'cancelled';
  if (run.status === 'QUEUED' || run.status === 'RUNNING') return 'running';
  if (run.outcome === 'CLARIFICATION_REQUIRED') return 'clarificationRequired';
  if (run.outcome === 'PROPOSAL') return 'proposalReady';
  if (run.outcome === 'NO_RESULTS') return 'noResults';
  if (run.engine === 'BASELINE' && run.degradedReason) return 'baselineReady';
  return 'boardReady';
}

function badgeFromSnapshot(run: JourneyRunSnapshot): string | null {
  if (run.engine === 'BASELINE' && run.degradedReason) return '기본 탐색 결과';
  return null;
}

export function reduceJourneyRunState(
  state: JourneyRunUiState,
  event: JourneyRunUiEvent,
): JourneyRunUiState {
  if (event.type === 'snapshot-synced') {
    return {
      ...state,
      view: viewFromSnapshot(event.run),
      badgeLabel: badgeFromSnapshot(event.run),
      renderSource: 'snapshot',
      run: event.run,
      needsSnapshotRecovery: false,
      connection: {
        ...state.connection,
        runId: event.run.runId,
      },
    };
  }

  const frame = event.frame;
  if (frame.event === 'run.stage') {
    return {
      ...state,
      view: 'running',
      latestSequence: frame.data.sequence,
      connection: { status: 'streaming', runId: frame.data.runId },
    };
  }
  if (frame.event === 'heartbeat') {
    return {
      ...state,
      latestSequence: frame.data.sequence,
      connection: { status: 'heartbeat', runId: frame.data.runId },
    };
  }
  if (frame.event === 'run.terminal') {
    return {
      ...state,
      renderSource: 'snapshot',
      latestSequence: frame.data.sequence,
      needsSnapshotRecovery: true,
      connection: { status: 'terminal', runId: frame.data.runId },
    };
  }
  return {
    ...state,
    renderSource: 'snapshot',
    needsSnapshotRecovery: true,
    connection: { status: 'reset', runId: frame.data.runId },
  };
}

export function shouldRecoverJourneySnapshot(state: JourneyRunUiState): boolean {
  return state.needsSnapshotRecovery;
}
