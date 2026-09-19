import { describe, expect, it } from 'vitest';
import { getPageContainerPresentation } from './pageContainerPresentation';

describe('getPageContainerPresentation', () => {
  it('lets the Hanok route render its ambient background with full bleed layout', () => {
    expect(getPageContainerPresentation('/hanok')).toEqual({
      isFullBleed: true,
      background: 'transparent',
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
