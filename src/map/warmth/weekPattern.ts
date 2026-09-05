import type { HeatDay } from '@/map/types';

/**
 * 요일별 혼잡도 패턴.
 *
 * 데이터랩 피드는 한 달가량 지연되므로 "다음 주 화요일이 한산할 것"이라고
 * 예보할 수는 없다. 대신 30일이면 요일마다 네다섯 번의 표본이 쌓이고,
 * 요일 리듬은 날씨보다 훨씬 완만하게 변한다. 그래서 예보 대신
 * "이 동네는 화요일이 가장 조용한 동네다"라는 성질을 말한다.
 *
 * 한옥에 가려는 사람이 실제로 쥐고 싶은 값이 이것이다.
 */

export interface WeekdayStat {
  /** 막대에 붙는 한 글자 — '월' */
  short: string;
  /** 읽어주는 이름 — '월요일' */
  full: string;
  /** 그 요일의 평균 혼잡도 */
  avg: number;
  /** 이 권역 30일 평균 대비 몇 % */
  delta: number;
  /** 표본 수. 적으면 말을 아껴야 한다. */
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

/** 가장 한적한 요일. 표본이 둘 미만인 요일은 우연일 수 있어 제외한다. */
export function quietestWeekday(stats: WeekdayStat[]): WeekdayStat | null {
  const solid = stats.filter((s) => s.samples >= 2);
  if (solid.length < 3) return null;

  return solid.reduce((best, s) => (s.avg < best.avg ? s : best), solid[0]);
}

/** 값 하나를 기준값과 견준 한 마디. 스크러버·뱃지·팝오버가 같은 말투를 쓴다. */
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

/** 배열의 중앙값. '평소'의 기준으로 평균보다 이상치에 덜 흔들린다. */
export function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
