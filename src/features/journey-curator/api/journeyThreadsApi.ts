import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { CursorPage } from '@/lib/api/cursor';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;










export interface JourneyThreadSummary {
  threadId: string;
  title: string;
  lastQuery: string;
  updatedAt: string;
  turnCount: number;
}

export interface JourneyThreadTurn {
  turnId: string;
  query: string;
  createdAt: string;
}

export interface JourneyThreadDetail extends JourneyThreadSummary {
  turns: JourneyThreadTurn[];
}

export interface JourneyThreadsRepository {
  listThreads(input?: { limit?: number; cursor?: string }): Promise<CursorPage<JourneyThreadSummary>>;
  getThread(threadId: string): Promise<JourneyThreadDetail>;
  deleteThread(threadId: string): Promise<void>;
}

export function createJourneyThreadsRepository(request: RequestFn = apiRequest): JourneyThreadsRepository {
  return {
    listThreads(input) {
      return request<CursorPage<JourneyThreadSummary>>('/me/journey-threads', {
        method: 'GET',
        params: { limit: input?.limit ?? 20, cursor: input?.cursor },
      });
    },
    getThread(threadId) {
      return request<JourneyThreadDetail>(`/me/journey-threads/${encodeURIComponent(threadId)}`, {
        method: 'GET',
      });
    },
    deleteThread(threadId) {
      return request<void>(`/me/journey-threads/${encodeURIComponent(threadId)}`, {
        method: 'DELETE',
        csrf: true,
      });
    },
  };
}

export const defaultJourneyThreadsRepository = createJourneyThreadsRepository();
