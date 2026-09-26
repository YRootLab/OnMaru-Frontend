import { isOnmaruApiError } from '@/lib/api/errors';
import type { StampRankingStatusResponse } from '../domain/models';
import type { StampRepository } from './ports';

export async function setStampRankingParticipation(
  participating: boolean,
  repository: Pick<StampRepository, 'updateRankingParticipation'>,
): Promise<StampRankingStatusResponse> {
  try {
    return await repository.updateRankingParticipation(participating);
  } catch (error) {
    if (isOnmaruApiError(error) && error.code === 'CSRF_INVALID') {
      return repository.updateRankingParticipation(participating);
    }
    throw error;
  }
}
