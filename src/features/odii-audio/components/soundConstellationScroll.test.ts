import { describe, expect, it } from 'vitest';
import { getVirtualRange } from './soundConstellationScroll';

describe('getVirtualRange', () => {
  it('keeps the virtual start stable until the 92px row boundary', () => {
    expect(getVirtualRange(459, 500, 30).startIndex).toBe(0);
  });

  it('updates the virtual start after crossing the 92px row boundary', () => {
    expect(getVirtualRange(460, 500, 30).startIndex).toBe(1);
  });
});
