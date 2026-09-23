import { describe, expect, it } from 'vitest';
import { clusterWarmth, toReview } from './warmthRepo';
import { seedWarmth } from './seed';

const list = seedWarmth(Date.parse('2026-08-26T00:00:00Z'));

describe('clusterWarmth', () => {
  it('줌인(레벨 1)에서는 장소가 거의 흩어진 채로 남는다', () => {
    expect(clusterWarmth(list, 1).length).toBeGreaterThan(20);
  });

  it('줌아웃할수록 셀이 합쳐진다', () => {
    const near = clusterWarmth(list, 3).length;
    const far = clusterWarmth(list, 11).length;
    expect(far).toBeLessThan(near);
  });

  it('셀 개수가 달라져도 온기 총량은 보존된다', () => {
    for (const level of [1, 5, 9, 13]) {
      const total = clusterWarmth(list, level).reduce((n, c) => n + c.count, 0);
      expect(total).toBe(list.length);
    }
  });

  it('같은 장소의 여러 온기는 한 셀로 묶인다 — 경기전 3건', () => {
    const cells = clusterWarmth(list.filter((w) => w.placeId === 'jj-gyeonggijeon'), 5);
    expect(cells).toHaveLength(1);
    expect(cells[0].count).toBe(3);
  });
});

// TODO: filtering moved to backend
// describe('filterWarmth', () => {
//   it('분위기로 가른다', () => {
//     expect(filterWarmth(list, 'busy').every((w: any) => w.mood === '북적')).toBe(true);
//     expect(filterWarmth(list, 'quiet').every((w: any) => w.mood === '한적')).toBe(true);
//     expect(filterWarmth(list, 'all')).toHaveLength(list.length);
//   });
// });

describe('toReview', () => {
  it('score가 없을 때도 crowdMood에 맞는 mood 값을 매긴다 — 북적은 높게, 한적은 낮게', () => {
    const busy = list.filter((w) => w.mood === '북적' && w.score === undefined);
    const quiet = list.filter((w) => w.mood === '한적' && w.score === undefined);
    expect(busy.every((w) => toReview(w).mood >= 4)).toBe(true);
    expect(quiet.every((w) => toReview(w).mood <= 2)).toBe(true);
  });
});
