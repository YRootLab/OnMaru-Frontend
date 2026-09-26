import { beforeEach, describe, expect, it } from 'vitest';
import type { StampBookResponse, StampDef } from '../domain/models';
import { useStampStore } from './useStampStore';

const first: StampDef = {
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

const second: StampDef = { ...first, id: 'stamp_night', name: '야간', sealText: '夜景' };

const book: StampBookResponse = {
  schemaVersion: '1.3',
  summary: {
    collectedCount: 1,
    totalCount: 12,
    visitedRegionCount: 1,
    requiredRegionCount: 5,
    completionRate: 8,
  },
  stamps: [{
    code: 'stamp_bukchon',
    name: '북촌',
    rarity: 'COMMON',
    regionGroup: 'SEOUL',
    conditionLabel: '북촌 방문',
    description: '북촌 수결',
    sealText: '北村',
    iconName: 'Landmark',
    color: '#b91c1c',
    sortOrder: 1,
    collected: true,
    collectedAt: '2026-09-27T01:00:00Z',
    triggerPlaceId: 'place-award',
  }],
};

describe('stamp session store', () => {
  beforeEach(() => useStampStore.getState().resetAll());

  it('restores only server-confirmed trigger places and current-session successes', () => {
    useStampStore.getState().setBook(book);
    expect(useStampStore.getState().isPlaceVisited('place-award')).toBe(true);
    expect(useStampStore.getState().isPlaceVisited('place-other')).toBe(false);

    useStampStore.getState().recordSuccessfulCheckIn('place-other', book.summary);
    expect(useStampStore.getState().isPlaceVisited('place-other')).toBe(true);
  });

  it('shows every new award in queue order', () => {
    useStampStore.getState().enqueueAwards([first, second]);
    expect(useStampStore.getState().activeStampModal?.id).toBe('stamp_bukchon');

    useStampStore.getState().closeStampModal();
    expect(useStampStore.getState().activeStampModal?.id).toBe('stamp_night');

    useStampStore.getState().closeStampModal();
    expect(useStampStore.getState().activeStampModal).toBeNull();
  });

  it('clears private data without clearing a public catalog snapshot', () => {
    const catalog = { schemaVersion: '1.3' as const, stamps: [] };
    useStampStore.getState().setCatalog(catalog);
    useStampStore.getState().setBook(book);

    useStampStore.getState().clearPrivateState();

    expect(useStampStore.getState().catalog).toBe(catalog);
    expect(useStampStore.getState().book).toBeNull();
    expect(useStampStore.getState().isPlaceVisited('place-award')).toBe(false);
  });
});
