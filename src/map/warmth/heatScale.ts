import type { Warmth } from '@/map/types';

/**
 * 온기 히트맵의 두 축.
 *
 * 예전 히트맵은 축이 하나였다 — 셀 안의 온기 개수. 그런데 그건 "사람들이 많이
 * 얘기한 곳", 결국 유명한 곳을 칠하는 것이고 어느 지도앱이나 하는 일이다.
 *
 * 온기가 가진 고유한 값은 mood(북적/한적)다. 그래서 축을 둘로 나눈다.
 *
 *   색   — 분위기. 한적(청록) ↔ 반반(황금) ↔ 북적(주홍)
 *   진하기 — 온기가 몇 개나 쌓였는가. 근거가 얼마나 두터운지를 뜻한다
 *
 * 둘 다 실제 데이터에서 나온다. 지어낸 값은 없다.
 */

export interface MoodStat {
  /** 북적 비율 0(전부 한적) ~ 1(전부 북적). 온기가 없으면 null. */
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

/** 분위기 3단계. 범례와 blob이 같은 경계를 쓴다. */
export type MoodBand = 'quiet' | 'mixed' | 'busy';

export const QUIET_MAX = 0.35;
export const BUSY_MIN = 0.65;

export function bandOf(ratio: number): MoodBand {
  if (ratio <= QUIET_MAX) return 'quiet';
  if (ratio >= BUSY_MIN) return 'busy';
  return 'mixed';
}

export const MOOD_BANDS: { id: MoodBand; label: string; hint: string }[] = [
  { id: 'quiet', label: '한적', hint: '한적하다는 이야기가 대부분' },
  { id: 'mixed', label: '반반', hint: '때에 따라 갈림' },
  { id: 'busy', label: '북적', hint: '북적인다는 이야기가 대부분' },
];

/**
 * 분위기 색.
 *
 * 라이트/다크 각각 한 벌. 세 밴드가 색상환에서 충분히 떨어져 있어야
 * 흐릿한 blob 상태에서도 구분된다 (청록 168° / 황금 38° / 주홍 21°).
 */
const MOOD_HUE: Record<MoodBand, { light: [number, number, number]; dark: [number, number, number] }> = {
  quiet: { light: [61, 184, 152], dark: [0, 167, 106] },
  mixed: { light: [245, 166, 35], dark: [250, 170, 73] },
  busy: { light: [232, 90, 24], dark: [248, 87, 0] },
};

export interface HeatPaint {
  core: string;
  mid: string;
  fringe: string;
  band: MoodBand;
}

/**
 * blob 하나의 색.
 *
 * @param ratio    북적 비율 0~1
 * @param strength 근거 두께 0~1 (화면 안에서 가장 온기가 많은 셀이 1)
 */
export function heatPaint(ratio: number, strength: number, isDark: boolean): HeatPaint {
  const band = bandOf(ratio);
  const [r, g, b] = MOOD_HUE[band][isDark ? 'dark' : 'light'];

  /*
    온기 하나짜리 셀도 보이긴 해야 하므로 바닥을 깔고, 위로 갈수록 진해진다.
    다크 모드는 screen 블렌딩이라 같은 알파가 더 밝게 나와 조금 낮춘다.
  */
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

/** 범례 스와치용 대표색. */
export function bandSwatch(band: MoodBand, isDark: boolean): string {
  const [r, g, b] = MOOD_HUE[band][isDark ? 'dark' : 'light'];
  return `rgb(${r}, ${g}, ${b})`;
}

// ─────────────────────────────────────────
// 기간
// ─────────────────────────────────────────

export type WarmthPeriod = 'all' | '3d' | '7d' | '30d';

const DAY = 86_400_000;

export const PERIOD_OPTIONS: { id: WarmthPeriod; label: string }[] = [
  { id: '3d', label: '3일' },
  { id: '7d', label: '1주' },
  { id: '30d', label: '1달' },
  { id: 'all', label: '전체' },
];

const PERIOD_DAYS: Record<WarmthPeriod, number> = { '3d': 3, '7d': 7, '30d': 30, all: Infinity };

/**
 * 기간으로 자른다.
 *
 * createdAt이 ISO라 시간 축을 쓸 수 있다. 기간을 좁히면 히트맵이 눈에 띄게
 * 달라지는데, 그게 "지금 이 동네가 어떤지"를 보여주는 유일한 방법이다.
 */
export function filterByPeriod(list: Warmth[], period: WarmthPeriod): Warmth[] {
  const days = PERIOD_DAYS[period];
  if (!Number.isFinite(days)) return list;

  const cutoff = Date.now() - days * DAY;
  return list.filter((w) => Date.parse(w.createdAt) >= cutoff);
}
