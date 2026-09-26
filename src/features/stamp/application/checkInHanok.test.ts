import { describe, expect, it, vi } from 'vitest';
import type { CheckInResponse } from '../domain/models';
import { runHanokCheckIn } from './checkInHanok';

const response: CheckInResponse = {
  schemaVersion: '1.3',
  checkIn: {
    id: '7dc91220-a9e1-4afb-8599-5d7de8f5a846',
    placeId: 'place-1',
    checkedInAt: '2026-09-27T02:00:00Z',
    distanceMeters: 42,
    alreadyCheckedIn: false,
  },
  newAwards: [],
  summary: {
    collectedCount: 1,
    totalCount: 12,
    visitedRegionCount: 1,
    requiredRegionCount: 5,
    completionRate: 8,
  },
};

function ports(checkIn: ReturnType<typeof vi.fn>) {
  return {
    repository: { checkIn } as never,
    positionProvider: {
      getCurrentPosition: vi.fn(async () => ({
        latitude: 37.5826,
        longitude: 126.9831,
        accuracyMeters: 18.4,
      })),
    },
    createId: vi.fn(() => '00000000-0000-4000-8000-000000000001'),
  };
}

describe('runHanokCheckIn', () => {
  it('reuses one UUID and immutable body for a single service retry', async () => {
    const checkIn = vi.fn()
      .mockRejectedValueOnce({ status: 503, code: 'SERVICE_UNAVAILABLE', requestId: 'req-1' })
      .mockResolvedValueOnce(response);

    await expect(runHanokCheckIn('place-1', ports(checkIn))).resolves.toEqual(response);

    expect(checkIn).toHaveBeenCalledTimes(2);
    expect(checkIn.mock.calls[0]).toEqual(checkIn.mock.calls[1]);
  });

  it('reuses the request for one csrf refresh retry', async () => {
    const checkIn = vi.fn()
      .mockRejectedValueOnce({ status: 403, code: 'CSRF_INVALID', requestId: 'req-2' })
      .mockResolvedValueOnce(response);

    await expect(runHanokCheckIn('place-1', ports(checkIn))).resolves.toEqual(response);
    expect(checkIn).toHaveBeenCalledTimes(2);
    expect(checkIn.mock.calls[0]).toEqual(checkIn.mock.calls[1]);
  });

  it('does not retry an idempotency conflict', async () => {
    const conflict = { status: 409, code: 'IDEMPOTENCY_CONFLICT', requestId: 'req-3' };
    const checkIn = vi.fn().mockRejectedValue(conflict);

    await expect(runHanokCheckIn('place-1', ports(checkIn))).rejects.toBe(conflict);
    expect(checkIn).toHaveBeenCalledOnce();
  });
});
