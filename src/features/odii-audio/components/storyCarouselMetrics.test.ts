import { describe, expect, it } from 'vitest';
import { getRailIndicator, shouldUpdateRailIndicator } from './storyCarouselMetrics';

describe('story carousel metrics', () => {
  it('calculates indicator geometry and visible index', () => {
    const result = getRailIndicator({ scrollLeft: 400, scrollWidth: 1200, clientWidth: 400 }, 5);
    expect(result.left).toBeCloseTo(33.3333);
    expect(result.width).toBeCloseTo(33.3333);
    expect(result.index).toBe(3);
  });

  it('does not update semantic state for unchanged metrics', () => {
    const indicator = { left: 10, width: 30, index: 2 };
    expect(shouldUpdateRailIndicator(indicator, { ...indicator })).toBe(false);
    expect(shouldUpdateRailIndicator(indicator, { ...indicator, index: 3 })).toBe(true);
  });
});
