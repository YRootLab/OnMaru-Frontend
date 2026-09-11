import { describe, expect, it } from 'vitest';
import type { Warmth } from '@/features/map/types';
import { bandOf, filterByPeriod, heatPaint, moodStatOf } from './heatScale';

const DAY = 86_400_000;

function warmth(mood: Warmth['mood'], daysAgo = 0): Warmth {
  return {
    id: `${mood}-${daysAgo}-${Math.random()}`,
    placeId: 'p',
    placeName: '테스트 한옥',
    lat: 35.8,
    lng: 127.1,
    text: '테스트',
    mood,
    createdAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
  };
}

describe('moodStatOf', () => {
  it('온기가 없으면 ratio는 null — 색을 칠할 근거가 없다', () => {
    expect(moodStatOf([]).ratio).toBeNull();
  });

  it('전부 한적이면 0, 전부 북적이면 1', () => {
    expect(moodStatOf([warmth('한적'), warmth('한적')]).ratio).toBe(0);
    expect(moodStatOf([warmth('북적'), warmth('북적')]).ratio).toBe(1);
  });

  it('반반이면 0.5', () => {
    const stat = moodStatOf([warmth('북적'), warmth('한적')]);
    expect(stat.ratio).toBe(0.5);
    expect(stat.busy).toBe(1);
    expect(stat.quiet).toBe(1);
    expect(stat.total).toBe(2);
  });
});

describe('bandOf', () => {
  it('세 밴드가 범례 순서(한적 → 반반 → 북적)대로 갈린다', () => {
    expect(bandOf(0)).toBe('quiet');
    expect(bandOf(0.35)).toBe('quiet');
    expect(bandOf(0.5)).toBe('mixed');
    expect(bandOf(0.65)).toBe('busy');
    expect(bandOf(1)).toBe('busy');
  });
});

describe('heatPaint', () => {
  it('온기가 두터울수록 진해진다', () => {
    const alphaOf = (color: string) => Number(color.match(/([\d.]+)\)$/)?.[1] ?? 0);

    const thin = heatPaint(0.5, 0, false);
    const thick = heatPaint(0.5, 1, false);

    expect(alphaOf(thick.core)).toBeGreaterThan(alphaOf(thin.core));
  });

  it('분위기가 다르면 색이 다르다 — 개수가 같아도', () => {
    const quiet = heatPaint(0, 1, false);
    const busy = heatPaint(1, 1, false);

    expect(quiet.band).toBe('quiet');
    expect(busy.band).toBe('busy');
    expect(quiet.core).not.toBe(busy.core);
  });
});

describe('filterByPeriod', () => {
  it("'전체'는 자르지 않는다", () => {
    const list = [warmth('한적', 0), warmth('북적', 100)];
    expect(filterByPeriod(list, 'all')).toHaveLength(2);
  });

  it('기간 밖의 온기는 빠진다', () => {
    const list = [warmth('한적', 1), warmth('북적', 10), warmth('한적', 40)];

    expect(filterByPeriod(list, '3d')).toHaveLength(1);
    expect(filterByPeriod(list, '7d')).toHaveLength(1);
    expect(filterByPeriod(list, '30d')).toHaveLength(2);
  });
});
