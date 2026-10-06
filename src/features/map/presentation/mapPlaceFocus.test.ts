import { describe, expect, it, vi } from 'vitest';
import {
  getVisibleMapCenterOffset,
  focusPlaceInVisibleMap,
} from './mapPlaceFocus';

describe('getVisibleMapCenterOffset', () => {
  it('centers within the map area left visible by the open list and detail panels', () => {
    expect(getVisibleMapCenterOffset({ viewportWidth: 1710, listPanelOpen: true })).toBe(444);
    expect(getVisibleMapCenterOffset({ viewportWidth: 1280, listPanelOpen: true })).toBe(413);
  });

  it('does not offset the mobile map where desktop panels are hidden', () => {
    expect(getVisibleMapCenterOffset({ viewportWidth: 1023, listPanelOpen: true })).toBe(0);
  });
});

describe('focusPlaceInVisibleMap', () => {
  it('pans to a center that leaves the selected place in the visible map center', () => {
    const target = { id: 'target' };
    const adjustedCenter = { id: 'adjusted-center' };
    const coordsFromContainerPoint = vi.fn(() => adjustedCenter);
    const map = {
      getProjection: () => ({
        containerPointFromCoords: () => ({ getX: () => 300, getY: () => 200 }),
        coordsFromContainerPoint,
      }),
      panTo: vi.fn(),
    };
    const Point = vi.fn((x: number, y: number) => ({ x, y }));

    focusPlaceInVisibleMap({
      map,
      target,
      viewportWidth: 1710,
      listPanelOpen: true,
      createPoint: Point,
    });

    expect(Point).toHaveBeenCalledWith(-144, 200);
    expect(coordsFromContainerPoint).toHaveBeenCalledWith({ x: -144, y: 200 });
    expect(map.panTo).toHaveBeenCalledWith(adjustedCenter);
  });
});
