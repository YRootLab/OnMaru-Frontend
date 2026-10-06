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

  it('starts information mode with HANOK selected', () => {
    expect(useMapStore.getState().infoCategory).toBe('hanok');
  });

  it('resets information mode to HANOK when returning from warmth mode', () => {
    useMapStore.setState({
      mode: 'warmth',
      infoCategory: 'festival',
      listItems: [place('festival-1')],
      viewportItems: [{
        type: 'DISTRICT',
        name: '서울',
        center: { lat: 37.5, lng: 127 },
      }],
    });

    useMapStore.getState().setMode('info');

    expect(useMapStore.getState().infoCategory).toBe('hanok');
    expect(useMapStore.getState().listItems).toEqual([]);
    expect(useMapStore.getState().viewportItems).toEqual([]);
  });

  it('preserves a valid information selection when the active mode is selected again', () => {
    useMapStore.setState({ mode: 'info', infoCategory: 'festival', infoRegionCode: '11' });

    useMapStore.getState().setMode('info');

    expect(useMapStore.getState()).toMatchObject({
      infoCategory: 'festival',
      infoRegionCode: '11',
    });
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
    useMapStore.setState({
      listItems: [place('p-1')],
      listTotalCount: 23_675,
      listNextCursor: 'cursor-1',
      listSnapshotId: 'snap-1',
      viewportItems: [{ type: 'DISTRICT', name: '서울', center: { lat: 37.5, lng: 127 } }],
      viewportRenderMode: 'DISTRICT',
    });

    useMapStore.getState().setInfoCategory('hanok');

    expect(useMapStore.getState()).toMatchObject({
      infoCategory: 'hanok',
      listItems: [],
      listTotalCount: 0,
      listNextCursor: null,
      listSnapshotId: null,
      viewportItems: [],
      viewportRenderMode: null,
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

  it('captures the nationwide Hanok home once and restores both list surfaces', () => {
    const viewport = {
      center: { lat: 37.5, lng: 127 },
      level: 5,
      radius: 1_200,
    };
    useMapStore.setState({ committedViewport: viewport });
    useMapStore.getState().setInfoListScrollTop('desktop', 420);
    useMapStore.getState().setInfoListScrollTop('mobile', 180);

    useMapStore.getState().captureInfoHomeSnapshot();
    useMapStore.setState({
      committedViewport: { center: { lat: 35, lng: 129 }, level: 8, radius: 4_000 },
      infoListScrollTops: { desktop: 0, mobile: 0 },
    });
    useMapStore.getState().captureInfoHomeSnapshot();
    const snapshot = useMapStore.getState().consumeInfoHomeSnapshot();

    expect(snapshot).toEqual({
      viewport,
      listScrollTops: { desktop: 420, mobile: 180 },
    });
    expect(useMapStore.getState().infoHomeSnapshot).toBeNull();
    expect(useMapStore.getState().infoListRestoreRequest).toEqual({
      id: 1,
      scrollTops: { desktop: 420, mobile: 180 },
    });
  });

  it('does not capture a category or region result as the map home', () => {
    useMapStore.setState({ infoCategory: 'market' });
    useMapStore.getState().captureInfoHomeSnapshot();
    expect(useMapStore.getState().infoHomeSnapshot).toBeNull();

    useMapStore.setState({ infoCategory: 'hanok', infoRegionCode: '11' });
    useMapStore.getState().captureInfoHomeSnapshot();
    expect(useMapStore.getState().infoHomeSnapshot).toBeNull();
  });
});
