import { describe, expect, it } from 'vitest';
import { getDetailBadges } from './detailBadges';

describe('getDetailBadges', () => {
  it('keeps only the useful travel context and removes category-style labels', () => {
    expect(getDetailBadges('내 위치에서 4.1km · 차량 9분')).toEqual(['내 위치에서 4.1km · 차량 9분']);
  });

  it('does not render a badge when travel context is unavailable', () => {
    expect(getDetailBadges('')).toEqual([]);
  });
});
