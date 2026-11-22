import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { ConversationRepository } from '../application/conversationRepository';
import type {
  ConversationSnapshot,
  ExplorationPage,
  ExplorationSummary,
  ExplorationTurn,
  ExplorationTurnPage,
} from '../domain/conversation';
import type { RunAccepted } from '../api/journeyApi';
import type { JourneyRunSnapshot, JourneySseFrame } from '../api/journeyContract';
import { parseJourneySseFrame } from '../reducers/journeySseParser';
import { resolveJourneyEventsUrl } from '../api/journeyApi';
import { JOURNEY_PLANS } from '../data/curatedJourneys';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export function createConversationHttpRepository(request: RequestFn = apiRequest): ConversationRepository {
  return {
    listExplorations(input) {
      return request<ExplorationPage>('/explorations', {
        method: 'GET',
        cache: 'no-store',
        params: { limit: input?.limit ?? 20, cursor: input?.cursor },
      });
    },
    getExploration(explorationId) {
      return request<ConversationSnapshot>(`/explorations/${encodeURIComponent(explorationId)}`, {
        method: 'GET',
        cache: 'no-store',
      });
    },
    listTurns(input) {
      return request<ExplorationTurnPage>(`/explorations/${encodeURIComponent(input.explorationId)}/turns`, {
        method: 'GET',
        cache: 'no-store',
        params: { limit: input.limit ?? 20, cursor: input.cursor },
      });
    },
    createExploration(input) {
      return request<RunAccepted>('/explorations', {
        method: 'POST',
        body: {
          query: input.query,
          locale: 'ko-KR',
          regionCode: input.regionCode ?? null,
        },
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    createTurn(input) {
      return request<RunAccepted>(`/explorations/${encodeURIComponent(input.explorationId)}/turns`, {
        method: 'POST',
        body: {
          clientTurnId: input.clientTurnId,
          baseVersion: input.baseVersion,
          query: input.query,
          clarificationAnswer: input.clarificationAnswer ?? null,
        },
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    async getAcceptedSnapshots(accepted) {
      const [run, snapshot] = await Promise.all([
        request<JourneyRunSnapshot>(accepted.runUrl, { method: 'GET', cache: 'no-store', rootPath: true }),
        request<ConversationSnapshot>(accepted.snapshotUrl, { method: 'GET', cache: 'no-store', rootPath: true }),
      ]);
      return { run, snapshot };
    },
    subscribeToRunEvents(eventsUrl, onEvent, onError) {
      const source = new EventSource(resolveJourneyEventsUrl(eventsUrl), { withCredentials: true });
      const eventNames = ['run.stage', 'run.terminal', 'heartbeat', 'reset', 'auth_closed'] as const;
      const listeners = eventNames.map((eventName) => {
        const listener = (event: Event) => {
          const messageEvent = event as MessageEvent<string>;
          try {
            const frame = parseJourneySseFrame({ id: messageEvent.lastEventId, event: eventName, data: messageEvent.data });
            if (frame) onEvent(frame);
          } catch (error) {
            onError(error);
          }
        };
        source.addEventListener(eventName, listener);
        return { eventName, listener };
      });
      source.addEventListener('error', onError);
      return () => {
        listeners.forEach(({ eventName, listener }) => source.removeEventListener(eventName, listener));
        source.removeEventListener('error', onError);
        source.close();
      };
    },
    cancelRun(input) {
      return request<JourneyRunSnapshot>(`/explorations/${encodeURIComponent(input.explorationId)}/runs/${encodeURIComponent(input.runId)}/cancel`, {
        method: 'POST',
        body: {},
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
    deleteExploration(input) {
      return request<void>(`/explorations/${encodeURIComponent(input.explorationId)}`, {
        method: 'DELETE',
        csrf: true,
        idempotencyKey: input.idempotencyKey,
      });
    },
  };
}

const fixtureRun: JourneyRunSnapshot = {
  schemaVersion: '1.3', runId: 'fixture-run', status: 'COMPLETED', engine: 'BASELINE', degradedReason: null,
  stage: null, sequence: 1, outcome: 'INITIAL_BOARD', clarification: null, retryAfterMs: 0,
  createdAt: '2026-11-18T00:00:00.000Z', startedAt: '2026-11-18T00:00:00.000Z', deadlineAt: '2026-11-18T00:01:00.000Z', error: null,
};
const fixtureAccepted: RunAccepted = {
  schemaVersion: '1.3', explorationId: 'fixture-exploration', runId: fixtureRun.runId, stateVersion: 1,
  runUrl: '/api/v1/explorations/fixture-exploration/runs/fixture-run', eventsUrl: '/api/v1/explorations/fixture-exploration/runs/fixture-run/events', snapshotUrl: '/api/v1/explorations/fixture-exploration',
};
const fixtureSnapshot: ConversationSnapshot = {
  schemaVersion: '1.3', explorationId: fixtureAccepted.explorationId, stateVersion: 1, board: JOURNEY_PLANS.quiet as any,
  pinnedRefs: [], excludedRefs: [], unavailableRefs: [], latestRun: fixtureRun, pendingProposal: null, updatedAt: fixtureRun.createdAt,
};

const initialFixtureTurn: ExplorationTurn = {
  turnId: 'fixture-turn-1',
  query: '비 오는 날 조용한 서울 산책 코스 알려줘',
  createdAt: fixtureRun.createdAt,
  runId: fixtureRun.runId,
  response: {
    status: 'COMPLETED',
    outcome: 'INITIAL_BOARD',
    summary: JOURNEY_PLANS.quiet.querySummary,
    board: JOURNEY_PLANS.quiet as any,
    proposal: null,
    clarification: null,
    error: null,
  },
};

const mockExplorations: ExplorationSummary[] = [
  {
    explorationId: fixtureAccepted.explorationId,
    title: '고요한 한옥 산책',
    lastUserQueryPreview: '비 오는 날 조용한 서울 산책',
    latestRunStatus: fixtureRun.status,
    candidateCount: 5,
    pinnedCount: 0,
    updatedAt: fixtureSnapshot.updatedAt,
  },
];

const mockTurns = new Map<string, ExplorationTurn[]>([
  [fixtureAccepted.explorationId, [initialFixtureTurn]],
]);

const mockSnapshots = new Map<string, ConversationSnapshot>([
  [fixtureAccepted.explorationId, fixtureSnapshot],
]);

export const fixtureConversationRepository: ConversationRepository = {
  async listExplorations() {
    return {
      schemaVersion: '1.3',
      items: [...mockExplorations],
      totalCount: mockExplorations.length,
      nextCursor: null,
      hasMore: false,
    };
  },
  async getExploration(explorationId) {
    return mockSnapshots.get(explorationId) ?? fixtureSnapshot;
  },
  async listTurns(input) {
    const items = mockTurns.get(input.explorationId) ?? [initialFixtureTurn];
    return {
      schemaVersion: '1.3',
      items: [...items],
      nextCursor: null,
      hasMore: false,
    };
  },
  async createExploration(input) {
    const id = `exp-${Date.now()}`;
    const runId = `run-${Date.now()}`;
    const now = new Date().toISOString();
    const accepted: RunAccepted = {
      schemaVersion: '1.3',
      explorationId: id,
      runId,
      stateVersion: 1,
      runUrl: `/api/v1/explorations/${id}/runs/${runId}`,
      eventsUrl: `/api/v1/explorations/${id}/runs/${runId}/events`,
      snapshotUrl: `/api/v1/explorations/${id}`,
    };
    const board = JOURNEY_PLANS.quiet;
    const snapshot: ConversationSnapshot = {
      schemaVersion: '1.3',
      explorationId: id,
      stateVersion: 1,
      board: board as any,
      pinnedRefs: [],
      excludedRefs: [],
      unavailableRefs: [],
      latestRun: { ...fixtureRun, runId, createdAt: now, startedAt: now, deadlineAt: now },
      pendingProposal: null,
      updatedAt: now,
    };
    const turn: ExplorationTurn = {
      turnId: `turn-${Date.now()}`,
      query: input.query,
      createdAt: now,
      runId,
      response: {
        status: 'COMPLETED',
        outcome: 'INITIAL_BOARD',
        summary: board.querySummary,
        board: board as any,
        proposal: null,
        clarification: null,
        error: null,
      },
    };
    mockExplorations.unshift({
      explorationId: id,
      title: input.query.slice(0, 16),
      lastUserQueryPreview: input.query,
      latestRunStatus: 'COMPLETED',
      candidateCount: 5,
      pinnedCount: 0,
      updatedAt: now,
    });
    mockSnapshots.set(id, snapshot);
    mockTurns.set(id, [turn]);
    return accepted;
  },
  async createTurn(input) {
    const id = input.explorationId;
    const runId = `run-${Date.now()}`;
    const now = new Date().toISOString();
    const accepted: RunAccepted = {
      schemaVersion: '1.3',
      explorationId: id,
      runId,
      stateVersion: 2,
      runUrl: `/api/v1/explorations/${id}/runs/${runId}`,
      eventsUrl: `/api/v1/explorations/${id}/runs/${runId}/events`,
      snapshotUrl: `/api/v1/explorations/${id}`,
    };
    const turn: ExplorationTurn = {
      turnId: `turn-${Date.now()}`,
      query: input.query,
      createdAt: now,
      runId,
      response: {
        status: 'COMPLETED',
        outcome: 'PROPOSAL',
        summary: `${input.query}에 맞춰 준비한 여행 정보예요.`,
        board: JOURNEY_PLANS.quiet as any,
        proposal: null,
        clarification: null,
        error: null,
      },
    };
    const existing = mockTurns.get(id) || [];
    mockTurns.set(id, [...existing, turn]);
    return accepted;
  },
  async getAcceptedSnapshots(accepted) {
    return {
      run: fixtureRun,
      snapshot: mockSnapshots.get(accepted.explorationId) ?? fixtureSnapshot,
    };
  },
  subscribeToRunEvents(_eventsUrl, onEvent) {
    const timer = setTimeout(() => onEvent({ id: '1', event: 'run.terminal', data: { schemaVersion: '1.3', runId: fixtureRun.runId, sequence: 1, status: 'COMPLETED', outcome: 'INITIAL_BOARD' } }), 0);
    return () => clearTimeout(timer);
  },
  async cancelRun() { return { ...fixtureRun, status: 'CANCELLED', outcome: null }; },
  async deleteExploration(input) {
    const idx = mockExplorations.findIndex((e) => e.explorationId === input.explorationId);
    if (idx !== -1) mockExplorations.splice(idx, 1);
    mockTurns.delete(input.explorationId);
    mockSnapshots.delete(input.explorationId);
  },
};
export const conversationHttpRepository = USE_MOCK ? fixtureConversationRepository : createConversationHttpRepository();
