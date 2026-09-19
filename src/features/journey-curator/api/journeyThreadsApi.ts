import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { CursorPage } from '@/lib/api/cursor';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  GET /me/journey-threads, GET/DELETE /me/journey-threads/{threadId}.

  OpenAPI 스펙이 이 엔드포인트들의 success response를 아직 문서화하지 않았고,
  로그인 세션이 있어야 호출 가능해 이 세션에서 실제 응답을 확인하지 못했다.
  아래 타입은 journeyContract.ts의 기존 계약(turn/query/snapshot 개념)에서
  합리적으로 추정한 것이다 — 백엔드가 스키마를 채우거나 실제 응답을 확인하면
  이 파일의 타입만 맞추면 된다(호출부/훅은 그대로).
*/
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
