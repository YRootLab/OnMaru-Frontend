import { describe, expect, it } from 'vitest';
import type { Item } from '@/features/map/types';
import { arePlaceResultsEqual, placeMarkerSignature } from './placeResultIdentity';

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

  it('updates items when presentation fields change while keeping marker identity stable', () => {
    const changed = [{ ...place, name: '새 이름', dist: 20 }];

    expect(arePlaceResultsEqual([place], changed)).toBe(false);
    expect(placeMarkerSignature([place])).toBe(placeMarkerSignature(changed));
  });

  it('detects marker identity changes, order changes, additions and removals', () => {
    const second: Item = { ...place, id: 'b', name: 'B' };

    expect(placeMarkerSignature([place])).not.toBe(
      placeMarkerSignature([{ ...place, lat: 36.4 }]),
    );
    expect(placeMarkerSignature([place])).not.toBe(
      placeMarkerSignature([{ ...place, category: 'stay' }]),
    );
    expect(placeMarkerSignature([place, second])).not.toBe(
      placeMarkerSignature([second, place]),
    );
    expect(placeMarkerSignature([place])).not.toBe(placeMarkerSignature([]));
  });
});
