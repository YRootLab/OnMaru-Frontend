import { describe, expect, it } from 'vitest';
import { shouldAnimateMarkerEntrance } from './markerEntrancePolicy';

describe('marker entrance policy', () => {
  it('animates the first non-empty marker render', () => {
    expect(
      shouldAnimateMarkerEntrance({
        hasRendered: false,
        categoryChanged: false,
        reducedMotion: false,
      }),
    ).toBe(true);
  });

  it('animates an explicit category change', () => {
    expect(
      shouldAnimateMarkerEntrance({
        hasRendered: true,
        categoryChanged: true,
        reducedMotion: false,
      }),
    ).toBe(true);
  });

  it('keeps background refreshes and reduced-motion renders still', () => {
    expect(
      shouldAnimateMarkerEntrance({
        hasRendered: true,
        categoryChanged: false,
        reducedMotion: false,
      }),
    ).toBe(false);
    expect(
      shouldAnimateMarkerEntrance({
        hasRendered: false,
        categoryChanged: false,
        reducedMotion: true,
      }),
    ).toBe(false);
  });
});
