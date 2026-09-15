import type { ColorMode } from '@/design-system/tokens';

export function shouldUseLandingDarkSurface({
  isLandingPage,
  isLandingLight,
  themeMode,
}: {
  isLandingPage: boolean;
  isLandingLight: boolean;
  themeMode: ColorMode;
}): boolean {
  return themeMode === 'dark' && isLandingPage && !isLandingLight;
}
