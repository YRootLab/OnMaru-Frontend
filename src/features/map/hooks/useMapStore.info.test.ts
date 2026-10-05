import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from './useMapStore';
import type { InfoPlaceItem } from '../types';

function place(placeId: string): InfoPlaceItem {
  return {
    placeId,
    name: `Place ${placeId}`,
    category: 'HANOK',
    coordinates: { lat: 37.5, lng: 127 },
    region: { regionCode: '11', name: '서울' },
    thumbnailUrl: null,
    summary: '',
  };
}

describe('useMapStore info list state', () => {
  beforeEach(() => {
    useMapStore.setState(useMapStore.getInitialState(), true);
  });

  it('starts information mode with the required HANOK category selected', () => {
    expect(useMapStore.getState().infoCategory).toBe('hanok');
  });

  it('accepts HANOK as one canonical information category', () => {
    useMapStore.getState().setInfoCategory('hanok');

    expect(useMapStore.getState().infoCategory).toBe('hanok');
  });

  it('appends cursor pages without duplicating canonical placeId values', () => {
    useMapStore.getState().setListItems([place('p-1')], 2, 'cursor-1', 'snap-1');

    useMapStore.getState().appendListItems([place('p-1'), place('p-2')], null);

    expect(useMapStore.getState().listItems.map((item) => item.placeId)).toEqual(['p-1', 'p-2']);
    expect(useMapStore.getState().listNextCursor).toBeNull();
  });

  it('resets list and cursor state when the information category changes', () => {
    useMapStore.getState().setListItems([place('p-1')], 23_675, 'cursor-1', 'snap-1');

    useMapStore.getState().setInfoCategory('hanok');

    expect(useMapStore.getState()).toMatchObject({
      infoCategory: 'hanok',
      listItems: [],
      listTotalCount: 0,
      listNextCursor: null,
      listSnapshotId: null,
    });
  });

  it('resets list and cursor state when the region changes', () => {
    useMapStore.getState().setListItems([place('p-1')], 23_675, 'cursor-1', 'snap-1');

    useMapStore.getState().setInfoRegionCode('11', '서울');

    expect(useMapStore.getState()).toMatchObject({
      infoRegionCode: '11',
      infoRegionName: '서울',
      listItems: [],
      listTotalCount: 0,
      listNextCursor: null,
      listSnapshotId: null,
    });
  });
});
