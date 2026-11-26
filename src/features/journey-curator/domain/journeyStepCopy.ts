import type { JourneyRunEngine, JourneyRunOutcome, JourneyRunStage, JourneyRunStatus } from '../api/journeyContract';

/**
 * 채팅 진행 타임라인의 문구 테이블. 컴포넌트에는 문장을 직접 쓰지 않고 이 파일만 고친다.
 * 내부 단계 이름(RAG, 파이프라인, 검증 등)은 화면에 노출하지 않는다.
 */

/** 서버 실행 순서. 역행 방어에 사용한다. */
export const STAGE_ORDER: readonly JourneyRunStage[] = [
  'INTERPRETING',
  'RETRIEVING',
  'SELECTING_EVIDENCE',
  'GENERATING',
  'VALIDATING',
  'PERSISTING',
];

/** 사용자에게 보여 주는 단계. PERSISTING은 내부 저장 단계라 표시하지 않는다. */
export const VISIBLE_STAGES = ['INTERPRETING', 'RETRIEVING', 'SELECTING_EVIDENCE', 'GENERATING', 'VALIDATING'] as const;
export type VisibleStage = (typeof VISIBLE_STAGES)[number];

type StepCopy = { active: string; done: string };

/** 체크리스트처럼 훑이도록 짧은 명사형 라벨. 진행 중은 "{라벨} 중". */
const STEP_LABEL: Record<VisibleStage, string> = {
  INTERPRETING: '질문 이해',
  RETRIEVING: '장소 찾기',
  SELECTING_EVIDENCE: '장소 선정',
  GENERATING: '추천 이유 정리',
  VALIDATING: '근거 확인',
};

const STEP_COPY: Record<VisibleStage, StepCopy> = Object.fromEntries(
  VISIBLE_STAGES.map((stage) => [stage, { active: `${STEP_LABEL[stage]} 중`, done: STEP_LABEL[stage] }]),
) as Record<VisibleStage, StepCopy>;

/** 백엔드 run.item 프레임의 stepKey. */
export const ITEM_STEP_KEYS = ['UNDERSTAND', 'SEARCH', 'SELECT', 'WRITE', 'CHECK'] as const;
export type ItemStepKey = (typeof ITEM_STEP_KEYS)[number];

const STEP_KEY_TO_STAGE: Record<ItemStepKey, VisibleStage> = {
  UNDERSTAND: 'INTERPRETING',
  SEARCH: 'RETRIEVING',
  SELECT: 'SELECTING_EVIDENCE',
  WRITE: 'GENERATING',
  CHECK: 'VALIDATING',
};

export function getStageForStepKey(stepKey: ItemStepKey): VisibleStage {
  return STEP_KEY_TO_STAGE[stepKey];
}

export function getStepCopy(stage: JourneyRunStage): StepCopy | null {
  if (stage === 'PERSISTING') return null;
  return STEP_COPY[stage as VisibleStage] ?? null;
}

const RESULT_COPY = {
  NO_RESULTS: '조건에 맞는 장소를 찾지 못했어요. 조건을 넓히거나 바꿔 보세요.',
  CLARIFICATION_REQUIRED: '조금만 더 알려 주시면 더 잘 찾을 수 있어요.',
  BASELINE: '지금은 간단하게 추천해 드리고 있어요.',
  FAILED: '잠시 연결이 불안정해요. 다시 시도해 주세요.',
  RATE_LIMITED_RETRY: '잠시 뒤에 다시 시도해 주세요.',
  CANCELLED: '추천을 멈췄어요.',
} as const;

const EMPTY_ANSWER_COPY: Record<JourneyRunOutcome, string> = {
  INITIAL_BOARD: '추천 여정을 정리했어요. 아래 장소를 둘러보세요.',
  PROPOSAL: '변경 제안을 확인해 주세요.',
  CLARIFICATION_REQUIRED: RESULT_COPY.CLARIFICATION_REQUIRED,
  NO_RESULTS: RESULT_COPY.NO_RESULTS,
};

const DEFAULT_EMPTY_ANSWER_COPY = '추천 결과를 정리했어요.';

/** COMPLETED인데 본문이 비어 있을 때 outcome별 안내. 일반 요약 문장으로 대체하지 않는다. */
export function getAnswerFallbackCopy(outcome: JourneyRunOutcome | null): string {
  return (outcome && EMPTY_ANSWER_COPY[outcome]) || DEFAULT_EMPTY_ANSWER_COPY;
}

/** 완료된 단계의 문구. 검색·선정 단계는 개수가 있으면 개수를 넣는다. */
export function getStepDoneCopy(stage: VisibleStage, count?: number | null): string {
  const label = STEP_COPY[stage].done;
  const countable = stage === 'RETRIEVING' || stage === 'SELECTING_EVIDENCE';
  return countable && count != null ? `${label} · ${count}곳` : label;
}

/** 요청은 보냈지만 아직 단계 정보가 없을 때. */
export function getPreparingCopy(): string {
  return '여정을 준비하고 있어요.';
}

export function getCancelledCopy(): string {
  return RESULT_COPY.CANCELLED;
}

/** AI 엔진 resultReason(0건 사유)별 안내. 사유가 없으면 일반 안내를 쓴다. */
export type NoResultsReason = 'NO_CANDIDATES' | 'NO_RELEVANT_CANDIDATES';

const NO_RESULTS_REASON_COPY: Record<NoResultsReason, string> = {
  NO_CANDIDATES: '검색 조건에 맞는 등록 장소를 찾지 못했어요. 지역이나 검색어를 넓혀 보세요.',
  NO_RELEVANT_CANDIDATES: '장소는 검색되었지만 조건에 맞는 장소가 없어요. 조건을 조정해 보세요.',
};

export function isNoResultsReason(value: unknown): value is NoResultsReason {
  return value === 'NO_CANDIDATES' || value === 'NO_RELEVANT_CANDIDATES';
}

export function getNoResultsCopy(reason?: NoResultsReason | null): string {
  return (reason && NO_RESULTS_REASON_COPY[reason]) || RESULT_COPY.NO_RESULTS;
}

export function getClarificationCopy(): string {
  return RESULT_COPY.CLARIFICATION_REQUIRED;
}

/** 실패한 턴 말풍선에 쓰는 문구. */
export function getErrorCopy(errorCode: string | null | undefined): string {
  if (errorCode === 'RATE_LIMITED') return RESULT_COPY.RATE_LIMITED_RETRY;
  return RESULT_COPY.FAILED;
}

export type TerminalNoticeInput = {
  status: Exclude<JourneyRunStatus, 'QUEUED' | 'RUNNING'>;
  outcome: JourneyRunOutcome | null;
  errorCode: string | null;
  retryAfterMs: number;
  engine: JourneyRunEngine | null;
};

/** 실행이 끝난 뒤 진행 기록 아래에 붙이는 안내 문구들. */
export function getTerminalNotices(input: TerminalNoticeInput): string[] {
  const notices: string[] = [];
  if (input.engine === 'BASELINE') notices.push(RESULT_COPY.BASELINE);

  if (input.status === 'CANCELLED') {
    notices.push(RESULT_COPY.CANCELLED);
  } else if (input.status === 'FAILED') {
    if (input.errorCode === 'RATE_LIMITED') {
      const seconds = Math.max(1, Math.ceil(input.retryAfterMs / 1000));
      notices.push(input.retryAfterMs > 0 ? `${seconds}초 뒤에 다시 시도할 수 있어요.` : RESULT_COPY.RATE_LIMITED_RETRY);
    } else {
      notices.push(RESULT_COPY.FAILED);
    }
  } else if (input.outcome === 'NO_RESULTS') {
    notices.push(RESULT_COPY.NO_RESULTS);
  } else if (input.outcome === 'CLARIFICATION_REQUIRED') {
    notices.push(RESULT_COPY.CLARIFICATION_REQUIRED);
  }
  return notices;
}
