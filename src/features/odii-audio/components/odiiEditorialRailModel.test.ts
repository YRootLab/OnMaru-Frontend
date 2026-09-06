import { describe, expect, it } from 'vitest';
import { getVisibleRailPositions, shouldFetchRailCategory } from './odiiEditorialRailModel';

describe('Odii editorial rail window', () => {
  it('keeps at most five cards around the active card', () => {
    expect(getVisibleRailPositions(10)).toEqual([8, 9, 10, 11, 12]);
    expect(getVisibleRailPositions(-2)).toEqual([-4, -3, -2, -1, 0]);
  });

  it('fetches a category only when the rail is nearby or its tab was interacted with', () => {
    expect(shouldFetchRailCategory({ isRailNearby: false, isSelected: true, isInteracted: false })).toBe(false);
    expect(shouldFetchRailCategory({ isRailNearby: true, isSelected: true, isInteracted: false })).toBe(true);
    expect(shouldFetchRailCategory({ isRailNearby: false, isSelected: false, isInteracted: true })).toBe(true);
  });
});
