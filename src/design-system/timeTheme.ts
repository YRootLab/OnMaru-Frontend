import type { ColorMode } from './tokens';

const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 19;

export function resolveTimeAwareSystemMode({
  hour,
  prefersDark,
}: {
  hour: number;
  prefersDark: boolean;
}): ColorMode {
  if (hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR) return 'light';
  if (hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR) return 'dark';
  return prefersDark ? 'dark' : 'light';
}
