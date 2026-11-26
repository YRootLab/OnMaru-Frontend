import { describe, expect, it } from 'vitest';
import {
  getStageForStepKey,
  getStepDoneCopy,
  getAnswerFallbackCopy,
  getCancelledCopy,
  getClarificationCopy,
  getErrorCopy,
  getNoResultsCopy,
  getPreparingCopy,
  getStepCopy,
  getTerminalNotices,
  VISIBLE_STAGES,
} from './journeyStepCopy';

describe('journeyStepCopy', () => {
  it('shows five friendly steps and hides the internal PERSISTING stage', () => {
    expect(VISIBLE_STAGES).toEqual(['INTERPRETING', 'RETRIEVING', 'SELECTING_EVIDENCE', 'GENERATING', 'VALIDATING']);
    expect(getStepCopy('PERSISTING')).toBeNull();
  });

  it('returns active and done copy for each visible stage', () => {
    expect(getStepCopy('RETRIEVING')).toEqual({ active: '장소 찾기 중', done: '장소 찾기' });
    expect(getStepCopy('SELECTING_EVIDENCE')).toEqual({ active: '장소 선정 중', done: '장소 선정' });
    expect(getStepCopy('GENERATING')?.active).toBe('추천 이유 정리 중');
    expect(getStepCopy('VALIDATING')).toEqual({ active: '근거 확인 중', done: '근거 확인' });
  });

  it('describes a finished run with outcome-specific notices', () => {
    expect(getTerminalNotices({ status: 'COMPLETED', outcome: 'NO_RESULTS', errorCode: null, retryAfterMs: 0, engine: 'LLM' }))
      .toEqual(['조건에 맞는 장소를 찾지 못했어요. 조건을 넓히거나 바꿔 보세요.']);
    expect(getTerminalNotices({ status: 'CANCELLED', outcome: null, errorCode: null, retryAfterMs: 0, engine: 'LLM' }))
      .toEqual(['추천을 멈췄어요.']);
  });

  it('adds the simplified-recommendation notice for the baseline engine', () => {
    expect(getTerminalNotices({ status: 'COMPLETED', outcome: 'INITIAL_BOARD', errorCode: null, retryAfterMs: 0, engine: 'BASELINE' }))
      .toEqual(['지금은 간단하게 추천해 드리고 있어요.']);
  });

  it('turns RATE_LIMITED into a retry hint in seconds', () => {
    expect(getTerminalNotices({ status: 'FAILED', outcome: null, errorCode: 'RATE_LIMITED', retryAfterMs: 12_400, engine: 'LLM' }))
      .toEqual(['13초 뒤에 다시 시도할 수 있어요.']);
    expect(getErrorCopy('RATE_LIMITED')).toBe('잠시 뒤에 다시 시도해 주세요.');
  });

  it('uses the connection-unstable copy for generic failures', () => {
    expect(getTerminalNotices({ status: 'FAILED', outcome: null, errorCode: 'AI_TIMEOUT', retryAfterMs: 0, engine: 'LLM' }))
      .toEqual(['잠시 연결이 불안정해요. 다시 시도해 주세요.']);
    expect(getErrorCopy('AI_TIMEOUT')).toBe('잠시 연결이 불안정해요. 다시 시도해 주세요.');
  });

  it('never falls back to the generic summary when a completed answer is empty', () => {
    expect(getAnswerFallbackCopy('INITIAL_BOARD')).toBe('추천 여정을 정리했어요. 아래 장소를 둘러보세요.');
    expect(getAnswerFallbackCopy('PROPOSAL')).toBe('변경 제안을 확인해 주세요.');
    expect(getAnswerFallbackCopy(null)).toBe('추천 결과를 정리했어요.');
  });

  it('exposes the standalone copy used outside the timeline', () => {
    expect(getPreparingCopy()).toBe('여정을 준비하고 있어요.');
    expect(getCancelledCopy()).toBe('추천을 멈췄어요.');
    expect(getNoResultsCopy()).toBe('조건에 맞는 장소를 찾지 못했어요. 조건을 넓히거나 바꿔 보세요.');
    expect(getClarificationCopy()).toBe('조금만 더 알려 주시면 더 잘 찾을 수 있어요.');
  });

describe('run item copy (BE 1.4)', () => {
  it('shows the candidate and selected place counts when those steps finish', () => {
    expect(getStepDoneCopy('RETRIEVING', 12)).toBe('장소 찾기 · 12곳');
    expect(getStepDoneCopy('SELECTING_EVIDENCE', 3)).toBe('장소 선정 · 3곳');
  });

  it('falls back to the plain done copy when there is no count', () => {
    expect(getStepDoneCopy('RETRIEVING', null)).toBe('장소 찾기');
    expect(getStepDoneCopy('INTERPRETING', 5)).toBe('질문 이해');
  });

  it('maps backend step keys to the visible stages', () => {
    expect(getStageForStepKey('UNDERSTAND')).toBe('INTERPRETING');
    expect(getStageForStepKey('SEARCH')).toBe('RETRIEVING');
    expect(getStageForStepKey('CHECK')).toBe('VALIDATING');
  });
});

describe('no-results reason copy (AI resultReason)', () => {
  it('explains that no registered place matches the region or condition', () => {
    expect(getNoResultsCopy('NO_CANDIDATES')).toBe('검색 조건에 맞는 등록 장소를 찾지 못했어요. 지역이나 검색어를 넓혀 보세요.');
  });

  it('explains that candidates exist but none fit the requested schedule', () => {
    expect(getNoResultsCopy('NO_RELEVANT_CANDIDATES')).toBe('장소는 검색되었지만 조건에 맞는 장소가 없어요. 조건을 조정해 보세요.');
  });

  it('keeps the generic no-results copy when no reason is given', () => {
    expect(getNoResultsCopy(null)).toBe('조건에 맞는 장소를 찾지 못했어요. 조건을 넓히거나 바꿔 보세요.');
    expect(getNoResultsCopy()).toBe('조건에 맞는 장소를 찾지 못했어요. 조건을 넓히거나 바꿔 보세요.');
  });
});
});
