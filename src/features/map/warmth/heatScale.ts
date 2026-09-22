import type { Warmth } from '@/features/map/types';















export interface MoodStat {

  ratio: number | null;
  busy: number;
  quiet: number;
  total: number;
}

export function moodStatOf(list: Warmth[]): MoodStat {
  let busy = 0;
  let quiet = 0;

  for (const w of list) {
    if (w.mood === '북적') busy += 1;
    else quiet += 1;
  }

  const total = busy + quiet;
  return { ratio: total === 0 ? null : busy / total, busy, quiet, total };
}


export type MoodBand = 'quiet' | 'mixed' | 'busy';

export const QUIET_MAX = 0.35;
export const BUSY_MIN = 0.65;

export function bandOf(ratio: number): MoodBand {
  if (ratio <= QUIET_MAX) return 'quiet';
  if (ratio >= BUSY_MIN) return 'busy';
  return 'mixed';
}

export const MOOD_BANDS: { id: MoodBand; label: string; hint: string }[] = [
  { id: 'quiet', label: '고즈넉함', hint: '고요하고 한적한 쉼의 정취' },
  { id: 'mixed', label: '은은함', hint: '때에 따라 고요와 온기가 어우러짐' },
  { id: 'busy', label: '북적이는 정', hint: '사람과 발길이 모이는 따스한 활기' },
];







const MOOD_HUE: Record<MoodBand, { light: [number, number, number]; dark: [number, number, number] }> = {
  quiet: { light: [61, 184, 152], dark: [0, 167, 106] },
  mixed: { light: [245, 175, 40], dark: [250, 185, 50] },
  busy: { light: [240, 95, 15], dark: [255, 110, 30] },
};

export interface HeatPaint {
  core: string;
  mid: string;
  fringe: string;
  band: MoodBand;
}







export function heatPaint(ratio: number, strength: number, isDark: boolean): HeatPaint {
  const band = bandOf(ratio);
  const [r, g, b] = MOOD_HUE[band][isDark ? 'dark' : 'light'];





  const base = isDark ? 0.34 : 0.3;
  const span = isDark ? 0.5 : 0.52;
  const alpha = base + span * Math.min(1, strength);

  return {
    core: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
    mid: `rgba(${r}, ${g}, ${b}, ${(alpha * 0.6).toFixed(3)})`,
    fringe: `rgba(${r}, ${g}, ${b}, ${(alpha * 0.26).toFixed(3)})`,
    band,
  };
}


export function bandSwatch(band: MoodBand, isDark: boolean): string {
  const [r, g, b] = MOOD_HUE[band][isDark ? 'dark' : 'light'];
  return `rgb(${r}, ${g}, ${b})`;
}





export type WarmthPeriod = 'all' | '3d' | '7d' | '30d';

const DAY = 86_400_000;

export const PERIOD_OPTIONS: { id: WarmthPeriod; label: string }[] = [
  { id: '3d', label: '3일' },
  { id: '7d', label: '1주' },
  { id: '30d', label: '1달' },
  { id: 'all', label: '전체' },
];

const PERIOD_DAYS: Record<WarmthPeriod, number> = { '3d': 3, '7d': 7, '30d': 30, all: Infinity };







export function filterByPeriod(list: Warmth[], period: WarmthPeriod): Warmth[] {
  const days = PERIOD_DAYS[period];
  if (!Number.isFinite(days)) return list;

  const cutoff = Date.now() - days * DAY;
  return list.filter((w) => Date.parse(w.createdAt) >= cutoff);
}
