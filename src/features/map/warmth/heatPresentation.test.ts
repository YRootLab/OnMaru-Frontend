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

  it('ignores out-of-range visitor count values (> 100) in series to prevent surge color corruption', () => {
    const spotWithVisitorCountSeries: HeatSpot = {
      ...spot,
      congestionScore: 25,
      congestionLevel: 'relaxed',
      intensity: 0.25,
      series: [12500], // Raw visitor count (persons) instead of 0~100 score
    };

    const result = selectHeatSpotsForDay([spotWithVisitorCountSeries], 0);
    expect(result[0].congestionScore).toBe(25);
    expect(result[0].congestionLevel).toBe('relaxed');
    expect(result[0].intensity).toBe(0.25);
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
