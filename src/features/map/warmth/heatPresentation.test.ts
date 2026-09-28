import { describe, expect, it } from 'vitest';
import type { HeatSpot } from '@/features/map/types';
import { decodeHeatPayload, selectHeatSpotsForDay, selectTopHeatSpot } from './heatPresentation';

const spot: HeatSpot = {
  id: 'heat-1',
  placeId: 'p-jeonju-hanok-village',
  name: '전주 한옥마을',
  lat: 35.8151,
  lng: 127.153,
  district: '전주시',
  visitorCount: 120,
  congestionScore: 20,
  congestionLevel: 'relaxed',
  surgeMultiplier: 1,
  intensity: 0.2,
  series: [80],
};

describe('selectHeatSpotsForDay', () => {
  it('keeps an empty Heat response empty instead of synthesizing spots from reviews or places', () => {
    expect(selectHeatSpotsForDay([], 0)).toEqual([]);
  });

  it('projects the selected server series value without changing the Heat data source', () => {
    expect(selectHeatSpotsForDay([spot], 0)).toEqual([
      expect.objectContaining({ id: 'heat-1', congestionScore: 80, congestionLevel: 'surge' }),
    ]);
  });
});

describe('decodeHeatPayload', () => {
  it('accepts an empty successful Heat dataset so stale spots can be cleared', () => {
    expect(decodeHeatPayload({ spots: [], days: [] })).toEqual({ spots: [], days: [] });
  });

  it('rejects a malformed payload without changing the current Heat state', () => {
    expect(decodeHeatPayload({ spots: null })).toBeNull();
  });
});

describe('selectTopHeatSpot', () => {
  it('uses visitor observations rather than VisitReview counts for the live hotspot', () => {
    const quieter = { ...spot, id: 'heat-quiet', visitorCount: 20 };
    const busiest = { ...spot, id: 'heat-busy', visitorCount: 120 };

    expect(selectTopHeatSpot([quieter, busiest])?.id).toBe('heat-busy');
    expect(selectTopHeatSpot([])).toBeNull();
  });
});
