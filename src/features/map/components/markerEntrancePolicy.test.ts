import { describe, expect, it } from 'vitest';
import {
  advanceMarkerEntranceState,
  shouldAnimateMarkerEntrance,
} from './markerEntrancePolicy';

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

  it('keeps a category entrance pending until that category has markers', () => {
    const emptyCategory = advanceMarkerEntranceState(
      { hasRendered: true, category: 'spot', pendingCategory: false },
      { category: 'stay', markerCount: 0, reducedMotion: false },
    );

    expect(emptyCategory.animate).toBe(false);
    expect(emptyCategory.state.pendingCategory).toBe(true);

    const loadedCategory = advanceMarkerEntranceState(emptyCategory.state, {
      category: 'stay',
      markerCount: 2,
      reducedMotion: false,
    });

    expect(loadedCategory.animate).toBe(true);
    expect(loadedCategory.state.pendingCategory).toBe(false);
  });
});
