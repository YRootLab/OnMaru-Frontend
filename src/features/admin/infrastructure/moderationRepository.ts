import { apiRequest, getAccessToken, type ApiRequestOptions } from '@/lib/api/client';
import type { ModerationRepository, ModerationQueueResult } from '../application/ports';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

function authHeaders(operatorId: string): Record<string, string> {
  const headers: Record<string, string> = { 'X-OnMaru-Operator': operatorId };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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
