import { describe, expect, it } from 'vitest';
import { getVirtualRange } from './soundConstellationScroll';

describe('getVirtualRange', () => {
  it('keeps the rendered range stable for pixel-level scroll changes within one item', () => {
    expect(getVirtualRange(0, 500, 30)).toEqual(getVirtualRange(24, 500, 30));
  });

  it('updates the rendered range after crossing an item boundary', () => {
    expect(getVirtualRange(0, 500, 30)).not.toEqual(getVirtualRange(90, 500, 30));
  });
});
