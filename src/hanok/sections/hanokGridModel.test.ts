import { describe, expect, it } from 'vitest';
import type { Village } from '@/hanok/types';
import { getHanokGridPage } from './hanokGridModel';

function village(id: string, type = '고택·종택', badges: string[] = []): Village {
  return {
    id,
    name: id,
    region: '서울',
    addr: '서울',
    lat: 37.5,
    lng: 127,
    type,
    badges,
    image: null,
    hasImage: false,
    summary: id,
    overview: '',
  };
}

describe('getHanokGridPage', () => {
  it('keeps stable ids and a twelve-item page', () => {
    const villages = Array.from({ length: 14 }, (_, index) => village(`v-${index}`));
    const first = getHanokGridPage(villages, { activeType: '전체', activeBadges: [] }, 1);
    const second = getHanokGridPage(villages, { activeType: '전체', activeBadges: [] }, 1);

    expect(first.items).toHaveLength(12);
    expect(second.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));
    expect(first.totalPages).toBe(2);
  });

  it('excludes stays and applies every selected badge', () => {
    const villages = [
      village('matched', '고택·종택', ['고택', '국가지정']),
      village('partial', '고택·종택', ['고택']),
      village('stay', '한옥 고택 스테이', ['고택', '국가지정']),
    ];

    const result = getHanokGridPage(
      villages,
      { activeType: '고택·종택', activeBadges: ['고택', '국가지정'] },
      1,
    );

    expect(result.items.map((item) => item.id)).toEqual(['matched']);
    expect(result.filteredCount).toBe(1);
  });
});
