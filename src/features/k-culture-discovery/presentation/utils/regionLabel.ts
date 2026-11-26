import { getRegionFallbackLabel, resolveRegionKey } from '../../domain/discoveryPresentation';
import type { Region } from '../../domain/types';

export function getLocalizedRegionName(
  region: Region | null | undefined,
  t: (key: string) => string,
): string | null {
  const key = resolveRegionKey(region);
  if (key) return t(`regions.${key}`);
  return getRegionFallbackLabel(region);
}
