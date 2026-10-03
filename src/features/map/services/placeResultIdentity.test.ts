import { describe, expect, it } from 'vitest';
import type { Item } from '@/features/map/types';
import { arePlaceResultsEqual } from './placeResultIdentity';

const place: Item = {
  id: 'a',
  name: 'A',
  category: 'spot',
  lat: 36.3,
  lng: 127.7,
  addr: '',
  image: null,
  tel: null,
  dist: 10,
};

describe('place result identity', () => {
  it('keeps fully identical ordered results stable', () => {
    expect(arePlaceResultsEqual([place], [{ ...place }])).toBe(true);
  });

  it('updates items when presentation fields change', () => {
    const changed = [{ ...place, name: '새 이름', dist: 20 }];

    expect(arePlaceResultsEqual([place], changed)).toBe(false);
  });

  it('detects identity changes, order changes, additions and removals', () => {
    const second: Item = { ...place, id: 'b', name: 'B' };

    expect(arePlaceResultsEqual([place], [{ ...place, lat: 36.4 }])).toBe(false);
    expect(arePlaceResultsEqual([place], [{ ...place, category: 'stay' }])).toBe(false);
    expect(arePlaceResultsEqual([place, second], [second, place])).toBe(false);
    expect(arePlaceResultsEqual([place], [])).toBe(false);
  });
});
