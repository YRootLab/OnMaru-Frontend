import { apiRequest, getApiV1BaseUrl, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { BentoJourneyPlan } from '../types/journey.types';
import { JOURNEY_PLANS } from '../data/curatedJourneys';
import type { JourneyRunSnapshot, JourneySseFrame } from './journeyContract';
import { parseJourneySseFrame } from '../reducers/journeySseParser';

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

export type JourneyActionBody =
  | { type: 'PIN'; resourceRef: { type: string; id: string } }
  | { type: 'EXCLUDE'; resourceRef: { type: string; id: string } }
  | { type: 'PROPOSAL'; proposalId: string };

export type ApplyActionInput = {
  explorationId: string;
  baseVersion: number;
  action: JourneyActionBody;
  commandId?: string;
  idempotencyKey: string;
};

/** EventSource는 DOM 타입이라 서버(vitest node 환경)에서 그대로 new할 수 없다 — 주입 가능하게 둔다. */
export type JourneyEventSourceFactory = (url: string) => EventSource;

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
  /** FE #93: PIN/EXCLUDE/PROPOSAL 액션 적용, 갱신된 스냅샷을 돌려받는다. */
  applyAction(input: ApplyActionInput): Promise<ExplorationSnapshot>;
  /**
   * FE #93: 런 진행 상태 SSE 구독. onEvent는 run.stage/run.terminal/heartbeat/reset
   * 프레임마다 호출된다. 반환값은 구독 해제 함수.
   */
  subscribeToRunEvents(
    explorationId: string,
    runId: string,
    onEvent: (frame: JourneySseFrame) => void,
    options?: { onError?: (error: unknown) => void; createEventSource?: JourneyEventSourceFactory },
  ): () => void;
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
    applyAction(input) {
      return request<ExplorationSnapshot>(`/explorations/${input.explorationId}/actions`, {
        method: 'POST',
        body: {
          commandId: input.commandId,
          baseVersion: input.baseVersion,
          action: input.action,
        },
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    subscribeToRunEvents(explorationId, runId, onEvent, options) {
      const url = `${getApiV1BaseUrl()}/explorations/${explorationId}/runs/${runId}/events`;
      const createEventSource = options?.createEventSource ?? ((u) => new EventSource(u, { withCredentials: true }));
      const source = createEventSource(url);

      const eventNames = ['run.stage', 'run.terminal', 'heartbeat', 'reset'] as const;
      const listeners = eventNames.map((eventName) => {
        const listener = (event: Event) => {
          const messageEvent = event as MessageEvent<string>;
          try {
            onEvent(parseJourneySseFrame({ id: messageEvent.lastEventId, event: eventName, data: messageEvent.data }));
          } catch (err) {
            options?.onError?.(err);
          }
        };
        source.addEventListener(eventName, listener);
        return { eventName, listener };
      });

      const handleError = (event: Event) => options?.onError?.(event);
      source.addEventListener('error', handleError);

      return () => {
        listeners.forEach(({ eventName, listener }) => source.removeEventListener(eventName, listener));
        source.removeEventListener('error', handleError);
        source.close();
      };
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
  async applyAction() {
    return this.getExploration('fixture-exploration');
  },
  subscribeToRunEvents() {
    // fixture 모드는 실서버 SSE가 없다 — 구독할 것도 해제할 것도 없다.
    return () => {};
  },
};

export const defaultJourneyRepository = USE_MOCK ? fixtureJourneyRepository : createJourneyRepository();
