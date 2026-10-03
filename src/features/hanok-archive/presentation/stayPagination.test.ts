import { describe, expect, it } from 'vitest';
import { getStayPage, getStayPageCount, moveStayPage } from './stayPagination';

describe('stayPagination', () => {
  it('splits 80 stays into 12 bounded pages of seven', () => {
    expect(getStayPageCount(80)).toBe(12);
    expect(getStayPage(Array.from({ length: 80 }, (_, index) => index), 11)).toEqual([
      77,
      78,
      79,
    ]);
  });

  it('does not wrap beyond the first or final page', () => {
    expect(moveStayPage(0, -1, 12)).toBe(0);
    expect(moveStayPage(11, 1, 12)).toBe(11);
    expect(moveStayPage(5, 1, 12)).toBe(6);
  });
});
