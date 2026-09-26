import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type {
  CheckInResponse,
  StampBookResponse,
  StampCatalogResponse,
  StampLeaderboardResponse,
  StampRankingStatusResponse,
} from '../domain/models';
import type { CheckInPosition, StampRepository } from '../application/ports';

type ApiRequester = (path: string, options?: ApiRequestOptions) => Promise<unknown>;

export function createStampHttpRepository(
  request: ApiRequester = apiRequest as ApiRequester,
): StampRepository {
  return {
    getCatalog: () => request('/stamps', {
      method: 'GET',
      cache: 'no-store',
    }) as Promise<StampCatalogResponse>,
    getMyStampBook: () => request('/me/stamp-book', {
      method: 'GET',
      cache: 'no-store',
    }) as Promise<StampBookResponse>,
    checkIn: (placeId: string, body: CheckInPosition, idempotencyKey: string) => (
      request(`/places/${encodeURIComponent(placeId)}/check-ins`, {
        method: 'POST',
        body,
        cache: 'no-store',
        csrf: true,
        idempotencyKey,
      }) as Promise<CheckInResponse>
    ),
    getLeaderboard: (limit = 20) => request('/stamps/leaderboard', {
      method: 'GET',
      params: { limit },
      cache: 'no-store',
    }) as Promise<StampLeaderboardResponse>,
    getMyRanking: () => request('/me/stamp-ranking', {
      method: 'GET',
      cache: 'no-store',
    }) as Promise<StampRankingStatusResponse>,
    updateRankingParticipation: (participating: boolean) => (
      request('/me/stamp-ranking', {
        method: 'PUT',
        body: { participating },
        cache: 'no-store',
        csrf: true,
      }) as Promise<StampRankingStatusResponse>
    ),
  };
}

export const stampHttpRepository = createStampHttpRepository();
