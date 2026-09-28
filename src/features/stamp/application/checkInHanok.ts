import { isOnmaruApiError } from '@/lib/api/errors';
import type { CheckInResponse } from '../domain/models';
import type { PositionProvider, StampRepository } from './ports';

interface CheckInPorts {
  repository: Pick<StampRepository, 'checkIn'>;
  positionProvider: PositionProvider;
  createId: () => string;
}

function shouldRetryService(error: unknown): boolean {
  return isOnmaruApiError(error) && (error.status >= 500 || error.code === 'SERVICE_UNAVAILABLE');
}

function shouldRetryCsrf(error: unknown): boolean {
  return isOnmaruApiError(error) && error.code === 'CSRF_INVALID';
}

export async function runHanokCheckIn(
  placeId: string,
  ports: CheckInPorts,
): Promise<CheckInResponse> {
  const body = Object.freeze(await ports.positionProvider.getCurrentPosition());
  const idempotencyKey = ports.createId();
  let retriedService = false;
  let retriedCsrf = false;

  for (;;) {
    try {
      return await ports.repository.checkIn(placeId, body, idempotencyKey);
    } catch (error) {
      if (!retriedCsrf && shouldRetryCsrf(error)) {
        retriedCsrf = true;
        continue;
      }
      if (!retriedService && shouldRetryService(error)) {
        retriedService = true;
        continue;
      }
      throw error;
    }
  }
}
