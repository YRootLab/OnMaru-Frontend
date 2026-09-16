/**
 * 7일 MVP 새 계약 타입.
 *
 * 출처: new/seven-day-mvp-fe-handoff.md §12, new/fe-experience-api-implementation-report.md §7.
 * 기존 `journey.types.ts`(BentoJourneyPlan 등 고정 4종 카드 구조)는 건드리지 않는다 —
 * 새 화면이 완성된 뒤 무엇을 남길지는 최종적으로 사람이 결정한다.
 *
 * 필드명은 두 문서와 정확히 동일하게 맞춘다. OpenAPI가 나오기 전까지 이 파일이
 * FE 쪽 source of truth다.
 */

export type ResourceType = 'PLACE' | 'REGION' | 'TOPIC';

export type RelationType =
  | 'LOCATED_IN'
  | 'NEARBY'
  | 'SHARES_VERIFIED_TOPIC'
  | 'EDITORIAL_PAIRING';

export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type RunStage = 'INTERPRETING' | 'RETRIEVING' | 'VALIDATING' | 'PERSISTING';
export type RunOutcome = 'INITIAL_BOARD' | 'PROPOSAL' | 'CLARIFICATION_REQUIRED' | 'NO_RESULTS';

export type DistanceBand = 'NEAR' | 'MEDIUM' | 'FAR' | 'UNKNOWN';

export interface CreateExplorationRequest {
  query: string;
  locale: 'ko-KR';
  regionCode?: string | null;
}

export interface AcceptedRun {
  schemaVersion: '1.0';
  explorationId: string;
  runId: string;
  stateVersion: number;
  runUrl: string;
  snapshotUrl: string;
  retryAfterMs: number;
}

export interface RunSnapshot {
  schemaVersion: '1.0';
  runId: string;
  status: RunStatus;
  stage: RunStage | null;
  outcome: RunOutcome | null;
  retryAfterMs: number | null;
  startedAt: string | null;
  deadlineAt: string;
  error: ErrorEnvelope['error'] | null;
}

export interface ResourceRef {
  type: ResourceType;
  id: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: 'EXACT' | 'APPROXIMATE';
}

export interface ImageAsset {
  url: string;
  alt: string;
  sourceName: string;
}

export interface PlaceResource {
  ref: ResourceRef & { type: 'PLACE' };
  title: string;
  category: string;
  regionRef: ResourceRef & { type: 'REGION' };
  summary: string | null;
  image: ImageAsset | null;
  location: GeoPoint | null;
  sourceRefs: string[];
  unavailableFields: string[];
}

export interface RegionResource {
  ref: ResourceRef & { type: 'REGION' };
  title: string;
}

export interface TopicResource {
  ref: ResourceRef & { type: 'TOPIC' };
  title: string;
  description: string | null;
}

export interface Evidence {
  id: string;
  kind: 'PROVIDER_FIELD' | 'EDITORIAL_NOTE' | 'SPATIAL_CALCULATION';
  sourceName: string;
  sourceUrl: string | null;
  sourceRevision: string | null;
  summary: string;
  asOf: string | null;
}

export interface Relation {
  id: string;
  sourceRef: ResourceRef;
  targetRef: ResourceRef;
  type: RelationType;
  label: string;
  evidenceRefs: string[];
}

export interface ConstraintCheck {
  key: 'REGION' | 'TOPIC' | 'PACE' | 'TIME_BUDGET';
  status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN';
  label: string;
  evidenceRefs: string[];
}

export interface JourneyCandidate {
  placeRef: ResourceRef & { type: 'PLACE' };
  reason: string;
  evidenceRefs: string[];
  relationRefs: string[];
  constraintChecks: ConstraintCheck[];
}

export interface JourneyLeg {
  fromRef: ResourceRef & { type: 'PLACE' };
  toRef: ResourceRef & { type: 'PLACE' };
  order: number;
  distanceMeters: number | null;
  distanceKind: 'STRAIGHT_LINE' | 'UNKNOWN';
  distanceBand: DistanceBand;
}

export interface JourneyBoard {
  title: string;
  querySummary: string;
  regionRef: ResourceRef & { type: 'REGION' };
  candidates: JourneyCandidate[]; // 1..3
  legs: JourneyLeg[]; // candidates가 2개 이상이면 순서상 인접 장소 사이 N-1개
  resources: Array<PlaceResource | RegionResource | TopicResource>;
  relations: Relation[]; // max 10
  evidence: Evidence[];
}

export interface JourneyProposal {
  id: string;
  baseVersion: number;
  expiresAt: string;
  keptRefs: ResourceRef[];
  addedRefs: ResourceRef[];
  removedRefs: ResourceRef[];
  board: JourneyBoard;
  unknowns: string[];
}

export type JourneyHistoryType =
  | 'QUERY_SUBMITTED'
  | 'BOARD_COMMITTED'
  | 'PIN_CHANGED'
  | 'PROPOSAL_READY'
  | 'PROPOSAL_APPLIED'
  | 'PROPOSAL_DISMISSED'
  | 'RUN_FAILED';

export interface JourneyHistoryItem {
  id: string;
  type: JourneyHistoryType;
  createdAt: string;
  query: string | null; // QUERY_SUBMITTED에서만 사용자 원문
  runId: string | null;
  stateVersion: number;
  proposalId: string | null;
  affectedRefs: ResourceRef[];
}

export interface ExplorationSnapshot {
  schemaVersion: '1.0';
  explorationId: string;
  stateVersion: number;
  board: JourneyBoard | null;
  pinnedRefs: ResourceRef[];
  latestRun: {
    runId: string;
    status: RunStatus;
  } | null;
  pendingProposal: JourneyProposal | null;
  recentHistory: JourneyHistoryItem[]; // 시간 오름차순, 최대 20개
  updatedAt: string;
}

export interface MemberSummary {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: 'KAKAO';
}

export interface SavedJourneySummary {
  id: string;
  title: string;
  regionTitle: string;
  candidateCount: number;
  thumbnailUrl: string | null;
  savedAt: string;
  updatedAt: string;
}

export interface SavedJourneyDetail {
  id: string;
  title: string;
  savedStateVersion: number;
  board: JourneyBoard;
  pinnedRefs: ResourceRef[];
  savedAt: string;
}

export type ExplorationAction =
  | { type: 'PIN'; resourceRef: ResourceRef }
  | { type: 'UNPIN'; resourceRef: ResourceRef }
  | { type: 'APPLY_PROPOSAL'; proposalId: string }
  | { type: 'DISMISS_PROPOSAL'; proposalId: string };

export interface ActionRequest {
  commandId: string;
  baseVersion: number;
  action: ExplorationAction;
}

export interface ErrorEnvelope {
  error: {
    code:
      | 'INVALID_INPUT'
      | 'AUTH_REQUIRED'
      | 'NOT_FOUND'
      | 'ACTIVE_RUN'
      | 'VERSION_CONFLICT'
      | 'RATE_LIMITED'
      | 'AI_TIMEOUT'
      | 'AI_UNAVAILABLE'
      | 'NO_RESULTS'
      | 'RESOURCE_WITHDRAWN';
    message: string;
    retryable: boolean;
    traceId: string;
    details: Record<string, unknown> | null;
  };
}

/** distanceBand → 권장 connector 길이(px). seven-day-mvp-fe-handoff.md §7 */
export const DISTANCE_BAND_CONNECTOR_PX: Record<DistanceBand, number> = {
  NEAR: 48,
  MEDIUM: 88,
  FAR: 128,
  UNKNOWN: 64,
};
