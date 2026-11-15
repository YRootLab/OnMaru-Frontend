import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { ConversationRepository } from '../application/conversationRepository';
import type {
  ConversationSnapshot,
  ExplorationPage,
  ExplorationTurnPage,
} from '../domain/conversation';
import type { RunAccepted } from '../api/journeyApi';
import type { JourneyRunSnapshot, JourneySseFrame } from '../api/journeyContract';
import { parseJourneySseFrame } from '../reducers/journeySseParser';

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
      const source = new EventSource(eventsUrl, { withCredentials: true });
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

export const conversationHttpRepository = createConversationHttpRepository();
