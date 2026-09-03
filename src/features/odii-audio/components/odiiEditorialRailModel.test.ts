import { describe, expect, it } from 'vitest';
import { getVisibleRailPositions } from './odiiEditorialRailModel';

describe('Odii editorial rail window', () => {
  it('keeps at most five cards around the active card', () => {
    expect(getVisibleRailPositions(10)).toEqual([8, 9, 10, 11, 12]);
    expect(getVisibleRailPositions(-2)).toEqual([-4, -3, -2, -1, 0]);
  });
});
