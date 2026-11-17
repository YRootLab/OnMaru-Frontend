import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { ConversationRepository } from '../application/conversationRepository';
import type {
  ConversationSnapshot,
  ExplorationPage,
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
  schemaVersion: '1.3', explorationId: fixtureAccepted.explorationId, stateVersion: 1, board: JOURNEY_PLANS.quiet,
  pinnedRefs: [], excludedRefs: [], unavailableRefs: [], latestRun: fixtureRun, pendingProposal: null, updatedAt: fixtureRun.createdAt,
};
export const fixtureConversationRepository: ConversationRepository = {
  async listExplorations() { return { schemaVersion: '1.3', items: [{ explorationId: fixtureAccepted.explorationId, title: '고요한 한옥 산책', lastUserQueryPreview: '한옥 산책', latestRunStatus: fixtureRun.status, candidateCount: 0, pinnedCount: 0, updatedAt: fixtureSnapshot.updatedAt }], totalCount: 1, nextCursor: null, hasMore: false }; },
  async getExploration() { return fixtureSnapshot; },
  async listTurns() { return { schemaVersion: '1.3', items: [], nextCursor: null, hasMore: false }; },
  async createExploration() { return fixtureAccepted; },
  async createTurn() { return fixtureAccepted; },
  async getAcceptedSnapshots() { return { run: fixtureRun, snapshot: fixtureSnapshot }; },
  subscribeToRunEvents(_eventsUrl, onEvent) { const timer = setTimeout(() => onEvent({ id: '1', event: 'run.terminal', data: { schemaVersion: '1.3', runId: fixtureRun.runId, sequence: 1, status: 'COMPLETED', outcome: 'INITIAL_BOARD' } }), 0); return () => clearTimeout(timer); },
  async cancelRun() { return { ...fixtureRun, status: 'CANCELLED', outcome: null }; },
  async deleteExploration() {},
};
export const conversationHttpRepository = USE_MOCK ? fixtureConversationRepository : createConversationHttpRepository();
