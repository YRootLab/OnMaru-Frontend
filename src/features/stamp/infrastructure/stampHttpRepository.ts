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

function isStampCatalogResponse(value: unknown): value is StampCatalogResponse {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== '1.3' || !Array.isArray(candidate.stamps)) return false;

  return candidate.stamps.every((stamp) => {
    if (!stamp || typeof stamp !== 'object') return false;
    const definition = stamp as Record<string, unknown>;
    return typeof definition.code === 'string'
      && typeof definition.name === 'string'
      && typeof definition.description === 'string'
      && typeof definition.conditionLabel === 'string'
      && typeof definition.sealText === 'string'
      && typeof definition.iconName === 'string'
      && typeof definition.color === 'string'
      && ['COMMON', 'REGIONAL', 'RARE', 'LEGENDARY'].includes(String(definition.rarity))
      && ['REGION_VISIT', 'NIGHT_VISIT', 'REGION_COUNT'].includes(String(definition.conditionType))
      && (definition.requiredCount === null || typeof definition.requiredCount === 'number')
      && (definition.regionGroup === null || typeof definition.regionGroup === 'string')
      && typeof definition.sortOrder === 'number';
  });
}

export function createStampHttpRepository(
  request: ApiRequester = apiRequest as ApiRequester,
): StampRepository {
  return {
    async getCatalog() {
      const response = await request('/stamps', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!isStampCatalogResponse(response)) {
        throw new Error('Invalid stamp catalog response');
      }
      return response;
    },
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
