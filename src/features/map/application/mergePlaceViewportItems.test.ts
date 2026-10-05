import { describe, expect, it } from 'vitest';
import { mergePlaceViewportItems } from './mergePlaceViewportItems';
import type { ViewportItem } from '../types';

const place = (id: string, name = id): ViewportItem => ({
  type: 'PLACE', placeId: id, name, center: { lat: 36.35, lng: 127.75 },
});

describe('mergePlaceViewportItems', () => {
  it('keeps previously loaded places and refreshes matching IDs from the latest response', () => {
    expect(mergePlaceViewportItems([place('a'), place('b')], [place('b', 'updated'), place('c')]))
      .toEqual([place('a'), place('b', 'updated'), place('c')]);
  });

  it('bounds the cache without retaining aggregate items', () => {
    const previous = Array.from({ length: 500 }, (_, index) => place(String(index)));
    const merged = mergePlaceViewportItems(previous, [
      { type: 'CLUSTER', name: 'aggregate', count: 10, center: { lat: 36, lng: 127 } },
      place('new'),
    ]);
    expect(merged).toHaveLength(500);
    expect(merged[0].placeId).toBe('1');
    expect(merged.at(-1)?.placeId).toBe('new');
  });
});
