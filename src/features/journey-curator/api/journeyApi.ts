import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { BentoJourneyPlan } from '../types/journey.types';
import { JOURNEY_PLANS } from '../data/curatedJourneys';
import type { JourneyRunSnapshot } from './journeyContract';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type RunAccepted = {
  schemaVersion: '1.2';
  explorationId: string;
  runId: string;
  stateVersion: number;
  runUrl: string;
  eventsUrl: string;
  snapshotUrl: string;
};

export type ExplorationSnapshot = {
  schemaVersion: '1.2';
  id: string;
  stateVersion: number;
  board: BentoJourneyPlan | null;
  pendingProposal: null | {
    proposalId: string;
    kept: string[];
    added: string[];
    excluded: string[];
  };
  latestRun: JourneyRunSnapshot | null;
  execution: {
    dataMode: string;
    engine: 'LLM' | 'BASELINE';
    rankingVersion: string;
    datasetRevision: string;
  } | null;
};

export type StartJourneyInput = {
  query: string;
  idempotencyKey: string;
  regionCode?: string;
};

export type JourneyRepository = {
  start(input: StartJourneyInput): Promise<RunAccepted>;
  submitTurn(input: {
    explorationId: string;
    query: string;
    baseVersion: number;
    clientTurnId: string;
    clarificationAnswer?: unknown;
    idempotencyKey: string;
  }): Promise<RunAccepted>;
  getExploration(explorationId: string): Promise<ExplorationSnapshot>;
  getRun(explorationId: string, runId: string): Promise<JourneyRunSnapshot>;
  cancelRun(explorationId: string, runId: string): Promise<JourneyRunSnapshot>;
};

export function createJourneyRepository(request: RequestFn = apiRequest): JourneyRepository {
  return {
    start(input) {
      return request<RunAccepted>('/explorations', {
        method: 'POST',
        body: {
          query: input.query,
          locale: 'ko-KR',
          ...(input.regionCode ? { regionCode: input.regionCode } : {}),
        },
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    submitTurn(input) {
      return request<RunAccepted>(`/explorations/${input.explorationId}/turns`, {
        method: 'POST',
        body: {
          clientTurnId: input.clientTurnId,
          baseVersion: input.baseVersion,
          query: input.query,
          clarificationAnswer: input.clarificationAnswer,
        },
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    getExploration(explorationId) {
      return request<ExplorationSnapshot>(`/explorations/${explorationId}`, {
        method: 'GET',
        cache: 'no-store',
      });
    },
    getRun(explorationId, runId) {
      return request<JourneyRunSnapshot>(`/explorations/${explorationId}/runs/${runId}`, {
        method: 'GET',
        cache: 'no-store',
      });
    },
    cancelRun(explorationId, runId) {
      return request<JourneyRunSnapshot>(`/explorations/${explorationId}/runs/${runId}/cancel`, {
        method: 'POST',
        body: {},
        csrf: true,
      });
    },
  };
}

const fixtureRun: JourneyRunSnapshot = {
  schemaVersion: '1.2',
  runId: '00000000-0000-4000-8000-000000000101',
  status: 'COMPLETED',
  engine: 'BASELINE',
  degradedReason: 'AI_SERVICE_UNAVAILABLE',
  stage: null,
  outcome: 'INITIAL_BOARD',
  clarification: null,
  retryAfterMs: 0,
  createdAt: '2026-09-14T00:00:00.000Z',
  startedAt: '2026-09-14T00:00:01.000Z',
  deadlineAt: '2026-09-14T00:00:20.000Z',
  error: null,
};

export const fixtureJourneyRepository: JourneyRepository = {
  async start() {
    return {
      schemaVersion: '1.2',
      explorationId: 'fixture-exploration',
      runId: fixtureRun.runId,
      stateVersion: 1,
      runUrl: '/explorations/fixture-exploration/runs/00000000-0000-4000-8000-000000000101',
      eventsUrl: '/explorations/fixture-exploration/runs/00000000-0000-4000-8000-000000000101/events',
      snapshotUrl: '/explorations/fixture-exploration',
    };
  },
  async submitTurn(input) {
    return this.start({ query: input.query, idempotencyKey: input.idempotencyKey });
  },
  async getExploration() {
    return {
      schemaVersion: '1.2',
      id: 'fixture-exploration',
      stateVersion: 1,
      board: JOURNEY_PLANS.quiet,
      pendingProposal: null,
      latestRun: fixtureRun,
      execution: {
        dataMode: 'fixture',
        engine: 'BASELINE',
        rankingVersion: 'fixture',
        datasetRevision: 'local',
      },
    };
  },
  async getRun() {
    return fixtureRun;
  },
  async cancelRun() {
    return { ...fixtureRun, status: 'CANCELLED', outcome: null };
  },
};

export const defaultJourneyRepository = USE_MOCK ? fixtureJourneyRepository : createJourneyRepository();
