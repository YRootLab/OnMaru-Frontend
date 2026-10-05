import { describe, expect, it } from 'vitest';
import { selectInfoMarkerItems } from './infoMarker.service';
import type { ViewportItem } from '../types';

const placeItem: ViewportItem = {
  type: 'PLACE',
  placeId: 'canonical-1',
  name: '한옥 장소',
  category: 'HANOK',
  center: { lat: 37.5, lng: 127 },
  thumbnailUrl: null,
};

describe('selectInfoMarkerItems', () => {
  it.each(['REGION', 'DISTRICT'] as const)(
    'does not turn the national list into markers in %s mode',
    (renderMode) => {
      expect(selectInfoMarkerItems(renderMode, [placeItem])).toEqual([]);
    },
  );

  it('leaves singleton PLACE items in the CLUSTER bucket to the aggregate overlay', () => {
    expect(selectInfoMarkerItems('CLUSTER', [placeItem])).toEqual([]);
  });

  it('maps only canonical PLACE viewport items at the PLACE render bucket', () => {
    const aggregate: ViewportItem = {
      type: 'CLUSTER',
      name: '서울',
      count: 20,
      center: { lat: 37.5, lng: 127 },
    };

    expect(selectInfoMarkerItems('PLACE', [aggregate, placeItem])).toEqual([
      expect.objectContaining({ id: 'canonical-1', name: '한옥 장소', lat: 37.5, lng: 127 }),
    ]);
  });
});
