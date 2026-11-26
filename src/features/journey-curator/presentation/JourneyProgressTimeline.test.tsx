import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JourneyProgressTimeline from './JourneyProgressTimeline';
import { applyItemFrame, applyStageFrame, createProgress, finishProgress, type JourneyProgress } from '../domain/journeyProgress';

const NOW = Date.now();

function runningAt(stage: 'INTERPRETING' | 'RETRIEVING' | 'GENERATING', lastSignalAt = NOW): JourneyProgress {
  const base = createProgress({ runId: 'run-1', now: lastSignalAt, status: 'RUNNING' });
  return applyStageFrame(base, { runId: 'run-1', sequence: 1, stage, status: 'RUNNING' }, lastSignalAt);
}

describe('JourneyProgressTimeline', () => {
  it('shows finished steps, the active step, and keeps the live region on the active label', () => {
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={runningAt('RETRIEVING')} onToggle={vi.fn()} />);

    expect(markup).toContain('질문을 이해했어요');
    expect(markup).toContain('조건에 맞는 장소를 찾는 중');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).not.toContain('추천 이유를 정리하는 중');
  });

  it('never shows internal stage names or the hidden PERSISTING stage', () => {
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={runningAt('GENERATING')} onToggle={vi.fn()} />);

    expect(markup).not.toMatch(/PERSISTING|VALIDATING|RETRIEVING|RAG|파이프라인/);
  });

  it('says it is re-checking the connection when no signal arrives for 20 seconds', () => {
    const stale = runningAt('RETRIEVING', NOW - 25_000);
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={stale} onToggle={vi.fn()} />);

    expect(markup).toContain('연결을 다시 확인하고 있어요');
  });

  it('shows a collapsed summary button with the outcome notice after the run finishes', () => {
    const finished = finishProgress(runningAt('RETRIEVING'), {
      status: 'COMPLETED',
      outcome: 'NO_RESULTS',
      errorCode: null,
      retryAfterMs: 0,
      engine: 'LLM',
    });
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={{ ...finished, collapsed: true }} onToggle={vi.fn()} />);

    expect(markup).toContain('정리 과정 보기');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain('질문을 이해했어요');
    expect(markup).toContain('조건에 맞는 장소를 찾지 못했어요');
  });

  it('lists the completed steps when the summary is expanded', () => {
    const finished = finishProgress(runningAt('RETRIEVING'), {
      status: 'COMPLETED',
      outcome: 'INITIAL_BOARD',
      errorCode: null,
      retryAfterMs: 0,
      engine: 'BASELINE',
    });
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={{ ...finished, collapsed: false }} onToggle={vi.fn()} />);

    expect(markup).toContain('정리 과정 접기');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('장소를 찾았어요');
    expect(markup).toContain('지금은 간단하게 추천해 드리고 있어요.');
  });

  it('uses the counted copy for a finished search step', () => {
    let p = createProgress({ runId: 'run-1', now: NOW, status: 'RUNNING' });
    p = applyItemFrame(p, { kind: 'completed', runId: 'run-1', sequence: 1, itemId: 'SEARCH-1', status: 'DONE', count: 12 }, NOW);
    const markup = renderToStaticMarkup(<JourneyProgressTimeline progress={p} onToggle={vi.fn()} />);
    expect(markup).toContain('장소 12곳을 찾았어요');
  });
});
