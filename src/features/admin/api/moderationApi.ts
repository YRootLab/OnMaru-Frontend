import { apiRequest, getAccessToken, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type ModerationNextStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED';
export type ModerationReason = 'POLICY_VIOLATION' | 'SPAM_CONFIRMED' | 'FALSE_REPORT' | 'OTHER';

/*
  GET/POST /operations/moderation/* 는 회원 세션(cookie/CSRF)이 아니라 기존
  운영자 Bearer 토큰 패턴(Authorization + X-OnMaru-Operator 헤더)을 쓴다 —
  OpenAPI 스펙에 이 도메인만 유일하게 헤더 계약이 문서화돼 있다. apiRequest의
  나머지 인프라(에러 정규화 등)는 재사용하되 인증 헤더는 여기서 직접 얹는다.
*/
function authHeaders(operatorId: string): Record<string, string> {
  const headers: Record<string, string> = { 'X-OnMaru-Operator': operatorId };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export interface ModerationQueueItem {
  [key: string]: unknown;
}

export interface ModerationQueueResult {
  items: ModerationQueueItem[];
}

export interface ModerationRepository {
  getQueue(operatorId: string, limit?: number): Promise<ModerationQueueResult>;
  moderateReview(
    operatorId: string,
    reviewId: string,
    input: { nextStatus: ModerationNextStatus; reason?: ModerationReason },
  ): Promise<void>;
}

export function createModerationRepository(request: RequestFn = apiRequest): ModerationRepository {
  return {
    getQueue(operatorId, limit) {
      return request<ModerationQueueResult>('/operations/moderation/queue', {
        method: 'GET',
        params: { limit },
        headers: authHeaders(operatorId),
      });
    },
    moderateReview(operatorId, reviewId, input) {
      return request<void>(`/operations/moderation/visit-reviews/${encodeURIComponent(reviewId)}`, {
        method: 'POST',
        body: input,
        headers: authHeaders(operatorId),
      });
    },
  };
}

export const defaultModerationRepository = createModerationRepository();
