import { describe, expect, it } from 'vitest';
import { mapModeSearch } from './mapModeUrl';

describe('mapModeSearch', () => {
  it('replaces stale information filters when warmth is selected', () => {
    expect(mapModeSearch('?mode=info&category=hanok&regionCode=11&lat=37.5', 'warmth', 'hanok', '11'))
      .toBe('mode=warmth&lat=37.5');
  });

  it('restores the selected information category when switching back', () => {
    expect(mapModeSearch('?mode=warmth&lat=37.5', 'info', 'hanok', null))
      .toBe('mode=info&lat=37.5&category=hanok');
  });
});
