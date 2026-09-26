import { describe, expect, it, vi } from 'vitest';
import type { CheckInResponse, StampDef } from '../domain/models';
import { executeStampCheckIn } from './stampCheckInController';

const awardOne: StampDef = {
  id: 'stamp_bukchon',
  name: '북촌',
  rarity: 'common',
  region: 'seoul',
  regionName: '서울',
  condition: '북촌 방문',
  description: '북촌 수결',
  sealText: '北村',
  iconName: 'Landmark',
  color: '#b91c1c',
};
const awardTwo: StampDef = { ...awardOne, id: 'stamp_night', name: '야간 수결' };

function checkInResponse(overrides: Partial<CheckInResponse['checkIn']> = {}): CheckInResponse {
  return {
    schemaVersion: '1.3',
    checkIn: {
      id: '7dc91220-a9e1-4afb-8599-5d7de8f5a846',
      placeId: 'place-1',
      checkedInAt: '2026-09-27T02:00:00Z',
      distanceMeters: 42,
      alreadyCheckedIn: false,
      ...overrides,
    },
    newAwards: [],
    summary: {
      collectedCount: 2,
      totalCount: 12,
      visitedRegionCount: 1,
      requiredRegionCount: 5,
      completionRate: 16,
    },
  };
}

describe('stamp check-in controller', () => {
  it('returns a login intent without requesting a position for a guest', async () => {
    const runCheckIn = vi.fn();

    await expect(executeStampCheckIn({
      loggedIn: false,
      placeId: 'place-1',
      runCheckIn,
      recordSuccess: vi.fn(),
      refreshBook: vi.fn(),
      resolveAwards: vi.fn(),
      enqueueAwards: vi.fn(),
    })).resolves.toEqual({ kind: 'login-required' });

    expect(runCheckIn).not.toHaveBeenCalled();
  });

  it('records the visit and enqueues every award in server order', async () => {
    const response = {
      ...checkInResponse(),
      newAwards: [
        { code: 'stamp_bukchon', name: '북촌', sealText: '北村', rarity: 'COMMON' as const, collectedAt: '2026-09-27T02:00:00Z' },
        { code: 'stamp_night', name: '야간 수결', sealText: '夜景', rarity: 'RARE' as const, collectedAt: '2026-09-27T02:00:00Z' },
      ],
    };
    const recordSuccess = vi.fn();
    const enqueueAwards = vi.fn();

    await expect(executeStampCheckIn({
      loggedIn: true,
      placeId: 'place-1',
      runCheckIn: vi.fn(async () => response),
      recordSuccess,
      refreshBook: vi.fn(async () => undefined),
      resolveAwards: vi.fn(() => [awardOne, awardTwo]),
      enqueueAwards,
    })).resolves.toEqual({ kind: 'awarded', response, awardCount: 2 });

    expect(recordSuccess).toHaveBeenCalledWith('place-1', response.summary);
    expect(enqueueAwards).toHaveBeenCalledWith([awardOne, awardTwo]);
  });

  it('treats an already recorded 15-minute visit as success without an award modal', async () => {
    const response = checkInResponse({ alreadyCheckedIn: true });
    const enqueueAwards = vi.fn();

    await expect(executeStampCheckIn({
      loggedIn: true,
      placeId: 'place-1',
      runCheckIn: vi.fn(async () => response),
      recordSuccess: vi.fn(),
      refreshBook: vi.fn(async () => undefined),
      resolveAwards: vi.fn(() => []),
      enqueueAwards,
    })).resolves.toEqual({ kind: 'duplicate', response });

    expect(enqueueAwards).not.toHaveBeenCalled();
  });
});
