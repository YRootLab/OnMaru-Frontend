/**
 * Day 1 파일럿 fixture: 서울 종로구 서촌.
 *
 * seven-day-mvp-fe-handoff.md §13, §19와 fe-experience-api-implementation-report.md §14가
 * 요구하는 "파일럿 장소3개 이상 + REGION1개 + TOPIC2~4개 + relation + evidence"를
 * exploration.types.ts 계약대로 채운 동결 fixture다.
 *
 * 장소 네 곳(이상의 집·수성동계곡·통인시장·딜쿠샤)은 실제 종로구 서촌에 있는 곳이다.
 * 단, 좌표는 공개 정보 기반 근사치(accuracy: APPROXIMATE)이고 이미지·운영시간·접근성은
 * 실제 검수 전이라 이미지는 null, unavailableFields로 명시한다. sourceUrl도 실제 발행
 * 문서를 개별 확인하지 않은 채로는 추측해 채우지 않는다 — 백엔드 계약이 확정되면
 * Spring이 canonical 데이터로 교체한다.
 *
 * 데모 시나리오(seven-day-mvp-fe-handoff.md §4)를 그대로 따른다:
 *   최초 검색 → [이상의 집, 수성동계곡, 통인시장]
 *   "시장은 빼고 역사 이야기를 더 넣어줘" → 통인시장 제외, 딜쿠샤 추가, 이상의 집은 pin으로 유지
 */

import type {
  AcceptedRun,
  Evidence,
  ExplorationSnapshot,
  JourneyBoard,
  JourneyProposal,
  PlaceResource,
  RegionResource,
  Relation,
  RunSnapshot,
  TopicResource,
} from '../types/exploration.types';

const ASOF = '2026-09-10';

// ── Region ───────────────────────────────────────────────────────────────

export const REGION_SEOCHON: RegionResource = {
  ref: { type: 'REGION', id: 'region_seoul_jongno_seochon' },
  title: '서울 종로구 서촌',
};

// ── Topics (2~4) ─────────────────────────────────────────────────────────

export const TOPIC_LITERATURE: TopicResource = {
  ref: { type: 'TOPIC', id: 'topic_modern_literature' },
  title: '근대 문인의 자취',
  description: '시인 이상 등 근대 예술가들이 머물렀던 골목의 기록',
};

export const TOPIC_SCENIC_LANDSCAPE: TopicResource = {
  ref: { type: 'TOPIC', id: 'topic_scenic_landscape' },
  title: '진경산수의 배경',
  description: '겸재 정선이 그린 실경산수화의 실제 배경이 된 장소',
};

export const TOPIC_MODERN_HISTORY: TopicResource = {
  ref: { type: 'TOPIC', id: 'topic_modern_history' },
  title: '근현대사의 현장',
  description: '일제강점기와 해방 전후의 기록이 남아있는 공간',
};

export const TOPIC_MARKET_LIFE: TopicResource = {
  ref: { type: 'TOPIC', id: 'topic_market_life' },
  title: '골목 시장의 활기',
  description: '서촌 주민의 생활과 먹거리가 모이는 전통시장',
};

// ── Places ───────────────────────────────────────────────────────────────

export const PLACE_YISANG: PlaceResource = {
  ref: { type: 'PLACE', id: 'place_yisang_house' },
  title: '이상의 집',
  category: '문학 기념공간',
  regionRef: REGION_SEOCHON.ref,
  summary: '시인 이상이 살던 터에 조성된 작은 문화공간. 골목 안쪽이라 인적이 드물다.',
  image: null,
  location: { latitude: 37.5798, longitude: 126.9701, accuracy: 'APPROXIMATE' },
  sourceRefs: ['ev_place_yisang'],
  unavailableFields: ['OPERATING_HOURS', 'ACCESSIBILITY'],
};

export const PLACE_SUSEONGDONG: PlaceResource = {
  ref: { type: 'PLACE', id: 'place_suseongdong_valley' },
  title: '수성동계곡',
  category: '역사 경관',
  regionRef: REGION_SEOCHON.ref,
  summary: '겸재 정선의 그림 배경이 된 계곡. 기린교와 물소리가 남아 있는 인왕산 자락.',
  image: null,
  location: { latitude: 37.5822, longitude: 126.9648, accuracy: 'APPROXIMATE' },
  sourceRefs: ['ev_place_suseongdong'],
  unavailableFields: ['ACCESSIBILITY'],
};

export const PLACE_TONGIN: PlaceResource = {
  ref: { type: 'PLACE', id: 'place_tongin_market' },
  title: '통인시장',
  category: '전통시장',
  regionRef: REGION_SEOCHON.ref,
  summary: '엽전 도시락으로 알려진 서촌의 오래된 골목 시장.',
  image: null,
  location: { latitude: 37.5807, longitude: 126.9694, accuracy: 'APPROXIMATE' },
  sourceRefs: ['ev_place_tongin'],
  unavailableFields: ['OPERATING_HOURS', 'ACCESSIBILITY'],
};

export const PLACE_DILKUSHA: PlaceResource = {
  ref: { type: 'PLACE', id: 'place_dilkusha' },
  title: '딜쿠샤',
  category: '근대 역사가옥',
  regionRef: REGION_SEOCHON.ref,
  summary: '외신기자 앨버트 테일러가 살던 붉은 벽돌집. 복원 중 벽 속에서 발견된 기록으로 알려졌다.',
  image: null,
  location: { latitude: 37.5798, longitude: 126.9636, accuracy: 'APPROXIMATE' },
  sourceRefs: ['ev_place_dilkusha'],
  unavailableFields: ['OPERATING_HOURS', 'ACCESSIBILITY'],
};

// ── Evidence ─────────────────────────────────────────────────────────────

export const EVIDENCE: Evidence[] = [
  {
    id: 'ev_place_yisang',
    kind: 'PROVIDER_FIELD',
    sourceName: '한국관광공사 대한민국 구석구석 (fixture, 검수 대기)',
    sourceUrl: null,
    sourceRevision: null,
    summary: '시인 이상의 흔적을 기념해 조성한 문화공간이라는 기본 소개.',
    asOf: ASOF,
  },
  {
    id: 'ev_place_suseongdong',
    kind: 'PROVIDER_FIELD',
    sourceName: '종로구 문화관광 (fixture, 검수 대기)',
    sourceUrl: null,
    sourceRevision: null,
    summary: '겸재 정선의 실경산수화 배경지라는 기본 소개.',
    asOf: ASOF,
  },
  {
    id: 'ev_place_tongin',
    kind: 'PROVIDER_FIELD',
    sourceName: '종로구 문화관광 (fixture, 검수 대기)',
    sourceUrl: null,
    sourceRevision: null,
    summary: '엽전 도시락으로 알려진 전통시장이라는 기본 소개.',
    asOf: ASOF,
  },
  {
    id: 'ev_place_dilkusha',
    kind: 'PROVIDER_FIELD',
    sourceName: '한국관광공사 대한민국 구석구석 (fixture, 검수 대기)',
    sourceUrl: null,
    sourceRevision: null,
    summary: '앨버트 테일러 가옥으로 복원되어 공개된 근대 역사가옥이라는 기본 소개.',
    asOf: ASOF,
  },
  {
    id: 'ev_spatial_calc',
    kind: 'SPATIAL_CALCULATION',
    sourceName: 'OnMaru 좌표 계산',
    sourceUrl: null,
    sourceRevision: null,
    summary: '인접 장소 좌표 기반 직선거리 계산. 실제 도보 경로가 아니다.',
    asOf: ASOF,
  },
  {
    id: 'ev_editorial_pairing',
    kind: 'EDITORIAL_NOTE',
    sourceName: 'OnMaru 편집팀 fixture',
    sourceUrl: null,
    sourceRevision: null,
    summary: '제출 데모용 편집 페어링. 실제 서비스 전 현장 검수가 필요하다.',
    asOf: ASOF,
  },
];

// ── Relations: 최초 보드 (이상의 집 / 수성동계곡 / 통인시장) ─────────────

export const RELATIONS_INITIAL: Relation[] = [
  {
    id: 'rel_located_yisang',
    sourceRef: PLACE_YISANG.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_yisang'],
  },
  {
    id: 'rel_located_suseongdong',
    sourceRef: PLACE_SUSEONGDONG.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_suseongdong'],
  },
  {
    id: 'rel_located_tongin',
    sourceRef: PLACE_TONGIN.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_tongin'],
  },
  {
    id: 'rel_nearby_yisang_suseongdong',
    sourceRef: PLACE_YISANG.ref,
    targetRef: PLACE_SUSEONGDONG.ref,
    type: 'NEARBY',
    label: '직선 약 540m',
    evidenceRefs: ['ev_spatial_calc'],
  },
  {
    id: 'rel_nearby_suseongdong_tongin',
    sourceRef: PLACE_SUSEONGDONG.ref,
    targetRef: PLACE_TONGIN.ref,
    type: 'NEARBY',
    label: '직선 약 430m',
    evidenceRefs: ['ev_spatial_calc'],
  },
  {
    id: 'rel_editorial_yisang_suseongdong',
    sourceRef: PLACE_YISANG.ref,
    targetRef: PLACE_SUSEONGDONG.ref,
    type: 'EDITORIAL_PAIRING',
    label: '편집자가 함께 선정: 문인의 산책로',
    evidenceRefs: ['ev_editorial_pairing'],
  },
];

// ── Relations: 변경안 (이상의 집[pin] / 수성동계곡 / 딜쿠샤) ─────────────

export const RELATIONS_PROPOSAL: Relation[] = [
  {
    id: 'rel_located_yisang_2',
    sourceRef: PLACE_YISANG.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_yisang'],
  },
  {
    id: 'rel_located_suseongdong_2',
    sourceRef: PLACE_SUSEONGDONG.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_suseongdong'],
  },
  {
    id: 'rel_located_dilkusha',
    sourceRef: PLACE_DILKUSHA.ref,
    targetRef: REGION_SEOCHON.ref,
    type: 'LOCATED_IN',
    label: '서촌에 위치',
    evidenceRefs: ['ev_place_dilkusha'],
  },
  {
    id: 'rel_nearby_yisang_suseongdong_2',
    sourceRef: PLACE_YISANG.ref,
    targetRef: PLACE_SUSEONGDONG.ref,
    type: 'NEARBY',
    label: '직선 약 540m',
    evidenceRefs: ['ev_spatial_calc'],
  },
  {
    id: 'rel_nearby_suseongdong_dilkusha',
    sourceRef: PLACE_SUSEONGDONG.ref,
    targetRef: PLACE_DILKUSHA.ref,
    type: 'NEARBY',
    label: '직선 약 290m',
    evidenceRefs: ['ev_spatial_calc'],
  },
  {
    id: 'rel_shared_topic_yisang_dilkusha',
    sourceRef: PLACE_YISANG.ref,
    targetRef: PLACE_DILKUSHA.ref,
    type: 'SHARES_VERIFIED_TOPIC',
    label: '같은 검수 주제: 근현대사의 현장',
    evidenceRefs: ['ev_place_yisang', 'ev_place_dilkusha'],
  },
  {
    id: 'rel_editorial_suseongdong_dilkusha',
    sourceRef: PLACE_SUSEONGDONG.ref,
    targetRef: PLACE_DILKUSHA.ref,
    type: 'EDITORIAL_PAIRING',
    label: '편집자가 함께 선정: 계곡에서 역사가옥으로',
    evidenceRefs: ['ev_editorial_pairing'],
  },
];

// ── Boards ───────────────────────────────────────────────────────────────

export const JOURNEY_BOARD_INITIAL: JourneyBoard = {
  title: '서촌, 문인의 골목에서 계곡까지',
  querySummary: '서촌에서 한옥과 역사 이야기를 조용히 만나고 싶어',
  regionRef: REGION_SEOCHON.ref,
  candidates: [
    {
      placeRef: PLACE_YISANG.ref,
      reason: '조용히 문학과 역사를 곱씹고 싶다는 요청과 맞아 골목 안쪽의 작은 문학 공간을 먼저 제안했어요.',
      evidenceRefs: ['ev_place_yisang'],
      relationRefs: ['rel_located_yisang', 'rel_editorial_yisang_suseongdong'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_yisang'] },
        { key: 'TOPIC', status: 'SATISFIED', label: '역사 이야기', evidenceRefs: ['ev_place_yisang'] },
      ],
    },
    {
      placeRef: PLACE_SUSEONGDONG.ref,
      reason: '겸재 정선의 그림 배경이 된 계곡이라 조용한 산책과 역사적 맥락을 함께 볼 수 있어요.',
      evidenceRefs: ['ev_place_suseongdong'],
      relationRefs: ['rel_located_suseongdong', 'rel_nearby_yisang_suseongdong'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_suseongdong'] },
        { key: 'PACE', status: 'SATISFIED', label: '조용한 동선', evidenceRefs: ['ev_place_suseongdong'] },
      ],
    },
    {
      placeRef: PLACE_TONGIN.ref,
      reason: '골목 산책 뒤 들를 수 있는 서촌 대표 전통시장이라 함께 넣었어요.',
      evidenceRefs: ['ev_place_tongin'],
      relationRefs: ['rel_located_tongin', 'rel_nearby_suseongdong_tongin'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_tongin'] },
        { key: 'TOPIC', status: 'UNKNOWN', label: '역사 이야기 비중은 낮음', evidenceRefs: [] },
      ],
    },
  ],
  legs: [
    {
      fromRef: PLACE_YISANG.ref,
      toRef: PLACE_SUSEONGDONG.ref,
      order: 1,
      distanceMeters: 540,
      distanceKind: 'STRAIGHT_LINE',
      distanceBand: 'MEDIUM',
    },
    {
      fromRef: PLACE_SUSEONGDONG.ref,
      toRef: PLACE_TONGIN.ref,
      order: 2,
      distanceMeters: 430,
      distanceKind: 'STRAIGHT_LINE',
      distanceBand: 'MEDIUM',
    },
  ],
  resources: [REGION_SEOCHON, PLACE_YISANG, PLACE_SUSEONGDONG, PLACE_TONGIN, TOPIC_LITERATURE, TOPIC_SCENIC_LANDSCAPE, TOPIC_MARKET_LIFE],
  relations: RELATIONS_INITIAL,
  evidence: EVIDENCE,
};

export const JOURNEY_BOARD_PROPOSAL: JourneyBoard = {
  title: '서촌, 문인의 골목에서 근현대사의 현장까지',
  querySummary: '고정한 장소는 두고 시장 대신 역사 이야기를 더 넣어줘',
  regionRef: REGION_SEOCHON.ref,
  candidates: [
    {
      placeRef: PLACE_YISANG.ref,
      reason: '고정하신 장소라 그대로 유지했어요.',
      evidenceRefs: ['ev_place_yisang'],
      relationRefs: ['rel_located_yisang_2', 'rel_shared_topic_yisang_dilkusha'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_yisang'] },
      ],
    },
    {
      placeRef: PLACE_SUSEONGDONG.ref,
      reason: '역사적 배경이 있는 경관이라 이번 요청에도 계속 맞아 유지했어요.',
      evidenceRefs: ['ev_place_suseongdong'],
      relationRefs: ['rel_located_suseongdong_2', 'rel_nearby_yisang_suseongdong_2'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_suseongdong'] },
      ],
    },
    {
      placeRef: PLACE_DILKUSHA.ref,
      reason: '시장 대신 넣어달라고 하신 역사 이야기와 맞아 근대 역사가옥을 추가했어요.',
      evidenceRefs: ['ev_place_dilkusha'],
      relationRefs: ['rel_located_dilkusha', 'rel_shared_topic_yisang_dilkusha'],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: '서촌 지역', evidenceRefs: ['ev_place_dilkusha'] },
        { key: 'TOPIC', status: 'SATISFIED', label: '역사 이야기', evidenceRefs: ['ev_place_dilkusha'] },
      ],
    },
  ],
  legs: [
    {
      fromRef: PLACE_YISANG.ref,
      toRef: PLACE_SUSEONGDONG.ref,
      order: 1,
      distanceMeters: 540,
      distanceKind: 'STRAIGHT_LINE',
      distanceBand: 'MEDIUM',
    },
    {
      fromRef: PLACE_SUSEONGDONG.ref,
      toRef: PLACE_DILKUSHA.ref,
      order: 2,
      distanceMeters: 290,
      distanceKind: 'STRAIGHT_LINE',
      distanceBand: 'NEAR',
    },
  ],
  resources: [
    REGION_SEOCHON,
    PLACE_YISANG,
    PLACE_SUSEONGDONG,
    PLACE_DILKUSHA,
    TOPIC_LITERATURE,
    TOPIC_SCENIC_LANDSCAPE,
    TOPIC_MODERN_HISTORY,
  ],
  relations: RELATIONS_PROPOSAL,
  evidence: EVIDENCE,
};

// ── Proposal envelope ────────────────────────────────────────────────────

export const JOURNEY_PROPOSAL: JourneyProposal = {
  id: 'proposal_01',
  baseVersion: 1,
  expiresAt: '2026-09-10T12:10:00Z',
  keptRefs: [PLACE_YISANG.ref, PLACE_SUSEONGDONG.ref],
  addedRefs: [PLACE_DILKUSHA.ref],
  removedRefs: [PLACE_TONGIN.ref],
  board: JOURNEY_BOARD_PROPOSAL,
  unknowns: [],
};

// ── AcceptedRun / RunSnapshot polling fixtures ──────────────────────────

export const ACCEPTED_RUN_INITIAL: AcceptedRun = {
  schemaVersion: '1.0',
  explorationId: 'exp_seochon_01',
  runId: 'run_seochon_01',
  stateVersion: 0,
  runUrl: '/api/v1/explorations/exp_seochon_01/runs/run_seochon_01',
  snapshotUrl: '/api/v1/explorations/exp_seochon_01',
  retryAfterMs: 1000,
};

export const RUN_SNAPSHOT_RUNNING: RunSnapshot = {
  schemaVersion: '1.0',
  runId: 'run_seochon_01',
  status: 'RUNNING',
  stage: 'RETRIEVING',
  outcome: null,
  retryAfterMs: 1000,
  startedAt: '2026-09-10T12:00:00Z',
  deadlineAt: '2026-09-10T12:00:20Z',
  error: null,
};

export const RUN_SNAPSHOT_COMPLETED_INITIAL: RunSnapshot = {
  schemaVersion: '1.0',
  runId: 'run_seochon_01',
  status: 'COMPLETED',
  stage: 'PERSISTING',
  outcome: 'INITIAL_BOARD',
  retryAfterMs: null,
  startedAt: '2026-09-10T12:00:00Z',
  deadlineAt: '2026-09-10T12:00:20Z',
  error: null,
};

export const RUN_SNAPSHOT_COMPLETED_PROPOSAL: RunSnapshot = {
  schemaVersion: '1.0',
  runId: 'run_seochon_02',
  status: 'COMPLETED',
  stage: 'PERSISTING',
  outcome: 'PROPOSAL',
  retryAfterMs: null,
  startedAt: '2026-09-10T12:03:00Z',
  deadlineAt: '2026-09-10T12:03:20Z',
  error: null,
};

export const RUN_SNAPSHOT_FAILED: RunSnapshot = {
  schemaVersion: '1.0',
  runId: 'run_seochon_03',
  status: 'FAILED',
  stage: null,
  outcome: null,
  retryAfterMs: null,
  startedAt: '2026-09-10T12:05:00Z',
  deadlineAt: '2026-09-10T12:05:20Z',
  error: {
    code: 'AI_TIMEOUT',
    message: '연결을 확인하는 데 시간이 오래 걸리고 있어요.',
    retryable: true,
    traceId: 'trace_fixture_03',
    details: null,
  },
};

// ── ExplorationSnapshot fixtures (Day 1 공동 산출물: INITIAL_BOARD / PROPOSAL / FAILED) ──

export const EXPLORATION_SNAPSHOT_INITIAL: ExplorationSnapshot = {
  schemaVersion: '1.0',
  explorationId: 'exp_seochon_01',
  stateVersion: 1,
  board: JOURNEY_BOARD_INITIAL,
  pinnedRefs: [],
  latestRun: { runId: 'run_seochon_01', status: 'COMPLETED' },
  pendingProposal: null,
  recentHistory: [
    {
      id: 'hist_01',
      type: 'QUERY_SUBMITTED',
      createdAt: '2026-09-10T12:00:00Z',
      query: '서촌에서 한옥과 역사 이야기를 조용히 만나고 싶어',
      runId: 'run_seochon_01',
      stateVersion: 0,
      proposalId: null,
      affectedRefs: [],
    },
    {
      id: 'hist_02',
      type: 'BOARD_COMMITTED',
      createdAt: '2026-09-10T12:00:18Z',
      query: null,
      runId: 'run_seochon_01',
      stateVersion: 1,
      proposalId: null,
      affectedRefs: [PLACE_YISANG.ref, PLACE_SUSEONGDONG.ref, PLACE_TONGIN.ref],
    },
  ],
  updatedAt: '2026-09-10T12:00:18Z',
};

export const EXPLORATION_SNAPSHOT_PROPOSAL_PENDING: ExplorationSnapshot = {
  schemaVersion: '1.0',
  explorationId: 'exp_seochon_01',
  stateVersion: 1,
  board: JOURNEY_BOARD_INITIAL,
  pinnedRefs: [PLACE_YISANG.ref],
  latestRun: { runId: 'run_seochon_02', status: 'COMPLETED' },
  pendingProposal: JOURNEY_PROPOSAL,
  recentHistory: [
    ...EXPLORATION_SNAPSHOT_INITIAL.recentHistory,
    {
      id: 'hist_03',
      type: 'PIN_CHANGED',
      createdAt: '2026-09-10T12:01:30Z',
      query: null,
      runId: null,
      stateVersion: 1,
      proposalId: null,
      affectedRefs: [PLACE_YISANG.ref],
    },
    {
      id: 'hist_04',
      type: 'QUERY_SUBMITTED',
      createdAt: '2026-09-10T12:02:40Z',
      query: '고정한 장소는 두고 시장 대신 역사 이야기를 더 넣어줘',
      runId: 'run_seochon_02',
      stateVersion: 1,
      proposalId: null,
      affectedRefs: [],
    },
    {
      id: 'hist_05',
      type: 'PROPOSAL_READY',
      createdAt: '2026-09-10T12:03:18Z',
      query: null,
      runId: 'run_seochon_02',
      stateVersion: 1,
      proposalId: 'proposal_01',
      affectedRefs: [PLACE_DILKUSHA.ref, PLACE_TONGIN.ref],
    },
  ],
  updatedAt: '2026-09-10T12:03:18Z',
};

export const EXPLORATION_SNAPSHOT_APPLIED: ExplorationSnapshot = {
  schemaVersion: '1.0',
  explorationId: 'exp_seochon_01',
  stateVersion: 2,
  board: JOURNEY_BOARD_PROPOSAL,
  pinnedRefs: [PLACE_YISANG.ref],
  latestRun: { runId: 'run_seochon_02', status: 'COMPLETED' },
  pendingProposal: null,
  recentHistory: [
    ...EXPLORATION_SNAPSHOT_PROPOSAL_PENDING.recentHistory,
    {
      id: 'hist_06',
      type: 'PROPOSAL_APPLIED',
      createdAt: '2026-09-10T12:04:00Z',
      query: null,
      runId: null,
      stateVersion: 2,
      proposalId: 'proposal_01',
      affectedRefs: [PLACE_DILKUSHA.ref, PLACE_TONGIN.ref],
    },
  ],
  updatedAt: '2026-09-10T12:04:00Z',
};

export const EXPLORATION_SNAPSHOT_FAILED_KEEPS_BOARD: ExplorationSnapshot = {
  schemaVersion: '1.0',
  explorationId: 'exp_seochon_01',
  stateVersion: 1,
  board: JOURNEY_BOARD_INITIAL,
  pinnedRefs: [PLACE_YISANG.ref],
  latestRun: { runId: 'run_seochon_03', status: 'FAILED' },
  pendingProposal: null,
  recentHistory: [
    ...EXPLORATION_SNAPSHOT_INITIAL.recentHistory,
    {
      id: 'hist_07',
      type: 'RUN_FAILED',
      createdAt: '2026-09-10T12:05:20Z',
      query: '해질 무렵 갈 만한 곳도 더 알려줘',
      runId: 'run_seochon_03',
      stateVersion: 1,
      proposalId: null,
      affectedRefs: [],
    },
  ],
  updatedAt: '2026-09-10T12:05:20Z',
};
