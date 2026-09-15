import { describe, expect, it } from 'vitest';
import { shouldUseLandingDarkSurface } from './headerSurface';

describe('shouldUseLandingDarkSurface', () => {
  it('does not force the Onmaru landing header dark while light theme is applied', () => {
    expect(
      shouldUseLandingDarkSurface({
        isLandingPage: true,
        isLandingLight: false,
        themeMode: 'light',
      }),
    ).toBe(false);
  });

  it('keeps the landing dark surface while dark theme is applied', () => {
    expect(
      shouldUseLandingDarkSurface({
        isLandingPage: true,
        isLandingLight: false,
        themeMode: 'dark',
      }),
    ).toBe(true);
  });
});
