import { describe, expect, it } from 'vitest';
import { heatSpotClusterKey, warmthRevealTarget } from './warmthVisibility';

describe('warmth visibility', () => {
  it('keeps same-named districts from different regions separate', () => {
    const seoul = { regionCode: 'kr-datalab-11500', placeId: 'seoul', id: 'a', lat: 37.56, lng: 126.83 };
    const busan = { regionCode: 'kr-datalab-26440', placeId: 'busan', id: 'b', lat: 35.10, lng: 128.89 };
    expect(heatSpotClusterKey(seoul)).not.toBe(heatSpotClusterKey(busan));
  });

  it('reveals rendered macro pins when nearby raw data has offscreen display anchors', () => {
    expect(warmthRevealTarget(9, { left: 500, top: 80, right: 1440, bottom: 800 }, [
      { x: 714, y: -331, lat: 36.8, lng: 127.75 },
      { x: -191, y: 454, lat: 36.35, lng: 127.1 },
    ])).toEqual({ level: 11 });
  });

  it('keeps the view when a rendered pin is actually visible', () => {
    expect(warmthRevealTarget(9, { left: 500, top: 80, right: 1440, bottom: 800 }, [
      { x: 714, y: 350, lat: 36.8, lng: 127.75 },
    ])).toBeNull();
  });

  it('moves to the nearest rendered district pin from an empty close view', () => {
    expect(warmthRevealTarget(4, { left: 500, top: 80, right: 1440, bottom: 800 }, [
      { x: 750, y: -300, lat: 36.8, lng: 127.75 },
      { x: -800, y: 400, lat: 35.1, lng: 128.9 },
    ])).toEqual({ center: { lat: 36.8, lng: 127.75 } });
  });
});
