import type { HeatDay } from '@/features/map/types';












export interface WeekdayStat {

  short: string;

  full: string;

  avg: number;

  delta: number;

  samples: number;
}

const WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

export function weekdayPattern(series: number[], days: HeatDay[]): WeekdayStat[] {
  if (series.length === 0 || series.length !== days.length) return [];

  const buckets = new Map<string, { sum: number; n: number }>();

  days.forEach((day, i) => {
    if (!day.weekday) return;
    const acc = buckets.get(day.weekday) || { sum: 0, n: 0 };
    acc.sum += series[i];
    acc.n += 1;
    buckets.set(day.weekday, acc);
  });

  if (buckets.size === 0) return [];

  const overall = series.reduce((a, b) => a + b, 0) / series.length;

  return WEEK.filter((full) => buckets.has(full)).map((full) => {
    const { sum, n } = buckets.get(full)!;
    const avg = sum / n;

    return {
      short: full.charAt(0),
      full,
      avg,
      delta: overall > 0 ? Math.round((avg / overall - 1) * 100) : 0,
      samples: n,
    };
  });
}


export function quietestWeekday(stats: WeekdayStat[]): WeekdayStat | null {
  const solid = stats.filter((s) => s.samples >= 2);
  if (solid.length < 3) return null;

  return solid.reduce((best, s) => (s.avg < best.avg ? s : best), solid[0]);
}


export function compareText(value: number, baseline: number): {
  tone: 'quiet' | 'busy' | 'flat';
  delta: number;
  text: string;
} {
  const delta = baseline > 0 ? Math.round((value / baseline - 1) * 100) : 0;

  if (delta <= -6) return { tone: 'quiet', delta, text: `평소보다 ${Math.abs(delta)}% 한적` };
  if (delta >= 6) return { tone: 'busy', delta, text: `평소보다 ${delta}% 붐빔` };
  return { tone: 'flat', delta, text: '평소와 비슷함' };
}


export function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
