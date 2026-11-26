import type { JourneyRunEngine, JourneyRunOutcome, JourneyRunStage, JourneyRunStatus, JourneyRunSnapshot } from '../api/journeyContract';
import { getStageForStepKey, STAGE_ORDER, VISIBLE_STAGES, type ItemStepKey, type VisibleStage } from './journeyStepCopy';

/** 이 시간 동안 아무 신호(heartbeat 또는 단계 프레임)가 없으면 "연결을 다시 확인하고 있어요"를 보여 준다. */
export const STALE_AFTER_MS = 20_000;

export type TerminalStatus = Exclude<JourneyRunStatus, 'QUEUED' | 'RUNNING'>;

export type JourneyProgressStep = {
  stage: VisibleStage;
  /** done: 완료, active: 진행 중, stopped: 실행이 실패/취소되어 멈춤 */
  state: 'done' | 'active' | 'stopped';
  /** 검색·선정 완료 시 백엔드가 준 개수. 없으면 생략 또는 null. */
  count?: number | null;
};

/** run.item 프레임으로 받은 단계 상태. 단계 프레임이 목록을 다시 만들어도 유지된다. */
export type ItemOverlay = Partial<Record<VisibleStage, { state: JourneyProgressStep['state']; count: number | null }>>;

export type JourneyProgress = {
  runId: string;
  status: JourneyRunStatus;
  currentStage: JourneyRunStage | null;
  steps: JourneyProgressStep[];
  items: ItemOverlay;
  /** 마지막으로 반영한 SSE sequence. 이 값 이하의 프레임은 무시한다. */
  lastSequence: number;
  /** 마지막으로 어떤 신호(heartbeat 또는 단계 프레임)를 받은 시각(ms). */
  lastSignalAt: number;
  reconnecting: boolean;
  finished: boolean;
  collapsed: boolean;
  outcome: JourneyRunOutcome | null;
  errorCode: string | null;
  retryAfterMs: number;
  engine: JourneyRunEngine | null;
};

export type StageFrameInput = {
  runId: string;
  sequence: number;
  stage: JourneyRunStage;
  status: JourneyRunStatus;
};

export type HeartbeatInput = { runId: string; sequence: number };

export type ItemFrameInput = {
  runId: string;
  sequence: number;
  itemId: string;
  kind: 'started' | 'completed';
  status?: 'DONE' | 'SKIPPED';
  count?: number | null;
};

const ITEM_ID_PATTERN = /^(UNDERSTAND|SEARCH|SELECT|WRITE|CHECK)-(\d+)$/;

/** "{stepKey}-{startSequence}" 형식의 itemId를 해석한다. 맞지 않으면 null. */
export function parseItemId(itemId: string): { stepKey: ItemStepKey; startSequence: number } | null {
  const match = ITEM_ID_PATTERN.exec(itemId);
  if (!match) return null;
  return { stepKey: match[1] as ItemStepKey, startSequence: Number(match[2]) };
}

export type FinishInput = {
  status: TerminalStatus;
  outcome: JourneyRunOutcome | null;
  errorCode: string | null;
  retryAfterMs: number;
  engine: JourneyRunEngine | null;
};

type RunSnapshotInput = Pick<JourneyRunSnapshot, 'runId' | 'status' | 'stage' | 'sequence' | 'engine' | 'outcome' | 'error' | 'retryAfterMs'>;

function orderOf(stage: JourneyRunStage | null): number {
  return stage ? STAGE_ORDER.indexOf(stage) : -1;
}

function isTerminal(status: JourneyRunStatus): status is TerminalStatus {
  return status !== 'QUEUED' && status !== 'RUNNING';
}

/**
 * 보이는 단계 목록. 현재 단계까지 앞 단계는 done, 현재 단계는 active.
 * item 상태가 있으면 그 상태와 개수를 우선한다.
 */
export function buildSteps(stage: JourneyRunStage | null, items: ItemOverlay = {}): JourneyProgressStep[] {
  const current = orderOf(stage);
  return VISIBLE_STAGES.flatMap((visible): JourneyProgressStep[] => {
    const overlay = items[visible];
    if (overlay) return [{ stage: visible, state: overlay.state, count: overlay.count }];
    const index = orderOf(visible);
    if (current >= 0 && index < current) return [{ stage: visible, state: 'done' }];
    if (index === current) return [{ stage: visible, state: 'active' }];
    return [];
  });
}

export function createProgress(input: {
  runId: string;
  now: number;
  status?: JourneyRunStatus;
  sequence?: number;
  engine?: JourneyRunEngine | null;
}): JourneyProgress {
  return {
    runId: input.runId,
    status: input.status ?? 'QUEUED',
    currentStage: null,
    steps: [],
    items: {},
    lastSequence: input.sequence ?? 0,
    lastSignalAt: input.now,
    reconnecting: false,
    finished: false,
    collapsed: false,
    outcome: null,
    errorCode: null,
    retryAfterMs: 0,
    engine: input.engine ?? null,
  };
}

export function applyStageFrame(progress: JourneyProgress, frame: StageFrameInput, now: number): JourneyProgress {
  if (frame.runId !== progress.runId) return progress;
  if (frame.sequence <= progress.lastSequence) return progress;

  const signal = { lastSequence: frame.sequence, lastSignalAt: now, reconnecting: false, status: frame.status };

  // 더 늦은 sequence라도 단계가 앞으로 가지 않으면 화면은 그대로 둔다(역행 방어).
  if (orderOf(frame.stage) < orderOf(progress.currentStage)) {
    return { ...progress, ...signal, status: frame.status };
  }
  if (frame.stage === progress.currentStage) {
    return { ...progress, ...signal };
  }
  return { ...progress, ...signal, currentStage: frame.stage, steps: buildSteps(frame.stage, progress.items) };
}

export function applyItemFrame(progress: JourneyProgress, frame: ItemFrameInput, now: number): JourneyProgress {
  if (frame.runId !== progress.runId) return progress;
  if (frame.sequence <= progress.lastSequence) return progress;

  const signal = { lastSequence: frame.sequence, lastSignalAt: now, reconnecting: false };
  const parsed = parseItemId(frame.itemId);
  if (!parsed) return { ...progress, ...signal };

  const stage = getStageForStepKey(parsed.stepKey);
  const entry =
    frame.kind === 'started'
      ? { state: 'active' as const, count: null }
      : frame.status === 'SKIPPED'
        ? { state: 'stopped' as const, count: null }
        : { state: 'done' as const, count: frame.count ?? null };
  const items: ItemOverlay = { ...progress.items, [stage]: entry };
  return { ...progress, ...signal, items, steps: buildSteps(progress.currentStage, items) };
}

export function applyHeartbeat(progress: JourneyProgress, frame: HeartbeatInput, now: number): JourneyProgress {
  if (frame.runId !== progress.runId) return progress;
  return {
    ...progress,
    lastSequence: Math.max(progress.lastSequence, frame.sequence),
    lastSignalAt: now,
    reconnecting: false,
  };
}

export function markReconnecting(progress: JourneyProgress, reconnecting: boolean): JourneyProgress {
  return progress.reconnecting === reconnecting ? progress : { ...progress, reconnecting };
}

export function finishProgress(progress: JourneyProgress, input: FinishInput): JourneyProgress {
  const completed = input.status === 'COMPLETED';
  const steps = progress.steps.map((step): JourneyProgressStep =>
    step.state === 'active' ? { ...step, state: completed ? 'done' : 'stopped' } : step,
  );
  return {
    ...progress,
    status: input.status,
    steps,
    finished: true,
    collapsed: true,
    reconnecting: false,
    outcome: input.outcome,
    errorCode: input.errorCode,
    retryAfterMs: input.retryAfterMs,
    engine: input.engine ?? progress.engine,
  };
}

/**
 * 스냅샷으로 진행 상태를 다시 맞춘다. 같은 실행이면 이 세션에서 받은 항목 개수를 유지하고,
 * 받은 적 없는 개수는 만들지 않는다(단계 문구만 보임). 다른 실행이면 스냅샷 값을 그대로 쓴다.
 */
export function mergeRecovered(prev: JourneyProgress | null, next: JourneyProgress): JourneyProgress {
  if (!prev || prev.runId !== next.runId) return next;
  const merged: JourneyProgress = {
    ...next,
    items: prev.items,
    steps: buildSteps(next.currentStage, prev.items),
    lastSequence: Math.max(prev.lastSequence, next.lastSequence),
  };
  if (!next.finished) return merged;
  return finishProgress(merged, {
    status: next.status as TerminalStatus,
    outcome: next.outcome,
    errorCode: next.errorCode,
    retryAfterMs: next.retryAfterMs,
    engine: next.engine,
  });
}

export function toggleCollapsed(progress: JourneyProgress): JourneyProgress {
  return { ...progress, collapsed: !progress.collapsed };
}

export function isActive(progress: JourneyProgress): boolean {
  return !progress.finished;
}

export function isStale(progress: JourneyProgress, now: number): boolean {
  return !progress.finished && now - progress.lastSignalAt >= STALE_AFTER_MS;
}

/** 취소 버튼은 서버가 RUNNING이라고 알려 준 동안에만 보인다. */
export function canCancel(progress: JourneyProgress): boolean {
  return !progress.finished && progress.status === 'RUNNING';
}

/** 스냅샷(GET)으로 진행 상태를 다시 맞출 때 쓴다. 이미 끝난 실행이면 완료 상태로 만든다. */
export function progressFromRun(run: RunSnapshotInput, now: number): JourneyProgress {
  const base = createProgress({
    runId: run.runId,
    status: run.status,
    sequence: run.sequence ?? 0,
    engine: run.engine,
    now,
  });
  const withStage: JourneyProgress = { ...base, currentStage: run.stage, steps: buildSteps(run.stage) };
  if (!isTerminal(run.status)) return withStage;
  return finishProgress(withStage, {
    status: run.status,
    outcome: run.outcome,
    errorCode: run.error?.code ?? null,
    retryAfterMs: run.retryAfterMs,
    engine: run.engine,
  });
}
