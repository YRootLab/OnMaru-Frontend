import { apiRequest, getAccessToken, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type ModerationNextStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED';
export type ModerationReason = 'POLICY_VIOLATION' | 'SPAM_CONFIRMED' | 'FALSE_REPORT' | 'OTHER';







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
