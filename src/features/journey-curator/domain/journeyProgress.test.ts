import { describe, expect, it } from 'vitest';
import {
  mergeRecovered,
  applyHeartbeat,
  applyItemFrame,
  parseItemId,
  applyStageFrame,
  canCancel,
  createProgress,
  finishProgress,
  isActive,
  isStale,
  progressFromRun,
  STALE_AFTER_MS,
  toggleCollapsed,
} from './journeyProgress';

const T0 = 1_000_000;

describe('journeyProgress', () => {
  it('marks earlier stages done and the current stage active', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'INTERPRETING', status: 'RUNNING' }, T0);
    p = applyStageFrame(p, { runId: 'run-1', sequence: 2, stage: 'RETRIEVING', status: 'RUNNING' }, T0);

    expect(p.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'active' },
    ]);
    expect(p.status).toBe('RUNNING');
  });

  it('ignores frames whose sequence is not newer than the last one applied', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 5, stage: 'RETRIEVING', status: 'RUNNING' }, T0);
    const duplicate = applyStageFrame(p, { runId: 'run-1', sequence: 5, stage: 'GENERATING', status: 'RUNNING' }, T0);
    const older = applyStageFrame(p, { runId: 'run-1', sequence: 3, stage: 'GENERATING', status: 'RUNNING' }, T0);

    expect(duplicate.currentStage).toBe('RETRIEVING');
    expect(older.currentStage).toBe('RETRIEVING');
  });

  it('never moves the timeline backwards when a later sequence carries an earlier stage', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'GENERATING', status: 'RUNNING' }, T0);
    p = applyStageFrame(p, { runId: 'run-1', sequence: 2, stage: 'RETRIEVING', status: 'RUNNING' }, T0);

    expect(p.currentStage).toBe('GENERATING');
    expect(p.steps.find((step) => step.stage === 'RETRIEVING')?.state).toBe('done');
  });

  it('ignores frames from a different run', () => {
    const p = createProgress({ runId: 'run-1', now: T0 });
    expect(applyStageFrame(p, { runId: 'run-2', sequence: 1, stage: 'RETRIEVING', status: 'RUNNING' }, T0)).toBe(p);
  });

  it('keeps PERSISTING out of the visible steps but completes the previous ones', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'VALIDATING', status: 'RUNNING' }, T0);
    p = applyStageFrame(p, { runId: 'run-1', sequence: 2, stage: 'PERSISTING', status: 'RUNNING' }, T0);

    expect(p.steps.map((step) => step.stage)).not.toContain('PERSISTING');
    expect(p.steps.every((step) => step.state === 'done')).toBe(true);
  });

  it('marks staleness only after the heartbeat window passes', () => {
    const p = createProgress({ runId: 'run-1', now: T0 });
    expect(isStale(p, T0 + STALE_AFTER_MS - 1)).toBe(false);
    expect(isStale(p, T0 + STALE_AFTER_MS)).toBe(true);

    const beat = applyHeartbeat(p, { runId: 'run-1', sequence: 0 }, T0 + STALE_AFTER_MS);
    expect(isStale(beat, T0 + STALE_AFTER_MS + 1)).toBe(false);
  });

  it('collapses and completes every step when the run finishes', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'RETRIEVING', status: 'RUNNING' }, T0);
    p = finishProgress(p, { status: 'COMPLETED', outcome: 'INITIAL_BOARD', errorCode: null, retryAfterMs: 0, engine: 'LLM' });

    expect(p.finished).toBe(true);
    expect(p.collapsed).toBe(true);
    expect(p.steps.every((step) => step.state === 'done')).toBe(true);
    expect(isActive(p)).toBe(false);
    expect(toggleCollapsed(p).collapsed).toBe(false);
  });

  it('stops the active step without claiming completion when the run fails or is cancelled', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'RETRIEVING', status: 'RUNNING' }, T0);
    p = finishProgress(p, { status: 'CANCELLED', outcome: null, errorCode: null, retryAfterMs: 0, engine: 'LLM' });

    expect(p.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'stopped' },
    ]);
  });

  it('allows cancel only while the run is RUNNING', () => {
    let p = createProgress({ runId: 'run-1', now: T0 });
    expect(canCancel(p)).toBe(false);
    p = applyStageFrame(p, { runId: 'run-1', sequence: 1, stage: 'INTERPRETING', status: 'RUNNING' }, T0);
    expect(canCancel(p)).toBe(true);
    p = finishProgress(p, { status: 'COMPLETED', outcome: 'INITIAL_BOARD', errorCode: null, retryAfterMs: 0, engine: 'LLM' });
    expect(canCancel(p)).toBe(false);
  });

  it('rebuilds the timeline from a snapshot after a dropped connection', () => {
    const p = progressFromRun(
      {
        runId: 'run-1',
        status: 'RUNNING',
        stage: 'GENERATING',
        sequence: 7,
        engine: 'LLM',
        outcome: null,
        error: null,
        retryAfterMs: 0,
      },
      T0,
    );

    expect(p.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'done' },
      { stage: 'SELECTING_EVIDENCE', state: 'done' },
      { stage: 'GENERATING', state: 'active' },
    ]);
    expect(p.lastSequence).toBe(7);
    expect(isActive(p)).toBe(true);
  });

describe('run item frames (BE 1.4)', () => {
  it('parses an itemId into its step key and start sequence', () => {
    expect(parseItemId('SEARCH-4')).toEqual({ stepKey: 'SEARCH', startSequence: 4 });
    expect(parseItemId('SEARCH')).toBeNull();
    expect(parseItemId('UNKNOWN-1')).toBeNull();
  });

  it('marks the item step active on start and records its count on DONE', () => {
    let p = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    p = applyItemFrame(p, { kind: 'started', runId: 'run-1', sequence: 1, itemId: 'SEARCH-1' }, T0);
    expect(p.steps).toEqual([{ stage: 'RETRIEVING', state: 'active', count: null }]);

    p = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 2, itemId: 'SEARCH-1', status: 'DONE', count: 12 }, T0);
    expect(p.steps).toEqual([{ stage: 'RETRIEVING', state: 'done', count: 12 }]);
  });

  it('keeps item counts when a later stage frame rebuilds the timeline', () => {
    let p = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    p = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 1, itemId: 'SEARCH-1', status: 'DONE', count: 12 }, T0);
    p = applyStageFrame(p, { runId: 'run-1', sequence: 2, stage: 'SELECTING_EVIDENCE', status: 'RUNNING' }, T0);

    expect(p.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'done', count: 12 },
      { stage: 'SELECTING_EVIDENCE', state: 'active' },
    ]);
  });

  it('shows a skipped item as stopped', () => {
    let p = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    p = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 1, itemId: 'SELECT-2', status: 'SKIPPED', count: null }, T0);
    expect(p.steps).toEqual([{ stage: 'SELECTING_EVIDENCE', state: 'stopped', count: null }]);
  });

  it('ignores item frames whose sequence is not newer', () => {
    let p = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    p = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 5, itemId: 'SEARCH-1', status: 'DONE', count: 12 }, T0);
    const stale = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 3, itemId: 'SEARCH-1', status: 'DONE', count: 99 }, T0);
    expect(stale).toBe(p);
  });
});

describe('recovery keeps counts received in this session (BE 1.4)', () => {
  it('keeps item counts that were already received when a snapshot re-syncs the run', () => {
    let prev = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    prev = applyItemFrame(prev, { kind: 'completed', runId: 'run-1', sequence: 2, itemId: 'SEARCH-1', status: 'DONE', count: 12 }, T0);
    const next = progressFromRun(
      { runId: 'run-1', status: 'RUNNING', stage: 'GENERATING', sequence: 5, engine: 'LLM', outcome: null, error: null, retryAfterMs: 0 },
      T0,
    );

    const merged = mergeRecovered(prev, next);
    expect(merged.steps.find((step) => step.stage === 'RETRIEVING')).toEqual({ stage: 'RETRIEVING', state: 'done', count: 12 });
    expect(merged.currentStage).toBe('GENERATING');
    expect(merged.lastSequence).toBe(5);
  });

  it('shows stage-only steps when this session never received a count', () => {
    const prev = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    const next = progressFromRun(
      { runId: 'run-1', status: 'RUNNING', stage: 'RETRIEVING', sequence: 2, engine: 'LLM', outcome: null, error: null, retryAfterMs: 0 },
      T0,
    );
    const merged = mergeRecovered(prev, next);
    expect(merged.steps).toEqual([
      { stage: 'INTERPRETING', state: 'done' },
      { stage: 'RETRIEVING', state: 'active' },
    ]);
  });

  it('keeps counts in a finished recovered run', () => {
    let prev = createProgress({ runId: 'run-1', now: T0, status: 'RUNNING' });
    prev = applyItemFrame(prev, { kind: 'completed', runId: 'run-1', sequence: 2, itemId: 'SELECT-3', status: 'DONE', count: 3 }, T0);
    const next = progressFromRun(
      { runId: 'run-1', status: 'COMPLETED', stage: 'VALIDATING', sequence: 6, engine: 'LLM', outcome: 'INITIAL_BOARD', error: null, retryAfterMs: 0 },
      T0,
    );
    const merged = mergeRecovered(prev, next);
    expect(merged.finished).toBe(true);
    expect(merged.steps.find((step) => step.stage === 'SELECTING_EVIDENCE')).toEqual({ stage: 'SELECTING_EVIDENCE', state: 'done', count: 3 });
  });

  it('returns the snapshot progress unchanged for a different run', () => {
    const prev = createProgress({ runId: 'run-old', now: T0, status: 'RUNNING' });
    const next = progressFromRun({ runId: 'run-new', status: 'RUNNING', stage: null, sequence: 0, engine: 'LLM', outcome: null, error: null, retryAfterMs: 0 }, T0);
    expect(mergeRecovered(prev, next)).toBe(next);
  });
});
});
