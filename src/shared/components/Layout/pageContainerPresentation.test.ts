import { describe, expect, it } from 'vitest';
import { getPageContainerPresentation } from './pageContainerPresentation';

describe('getPageContainerPresentation', () => {
  it('gives the Hanok route a white page canvas without changing its constrained layout', () => {
    expect(getPageContainerPresentation('/hanok')).toEqual({
      isFullBleed: false,
      background: '#ffffff',
      surface: 'hanok',
    });
  });

  it('preserves existing full-bleed routes', () => {
    expect(getPageContainerPresentation('/map')).toEqual({
      isFullBleed: true,
      background: 'transparent',
      surface: undefined,
    });
  });
});
