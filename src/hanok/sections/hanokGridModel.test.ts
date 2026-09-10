import { describe, expect, it } from 'vitest';
import { STAY_TYPE } from '@/hanok/types';
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

  it('applies every selected badge', () => {
    const villages = [
      village('matched', '고택·종택', ['고택', '국가지정']),
      village('partial', '고택·종택', ['고택']),
    ];

    const result = getHanokGridPage(
      villages,
      { activeType: '고택·종택', activeBadges: ['고택', '국가지정'] },
      1,
    );

    expect(result.items.map((item) => item.id)).toEqual(['matched']);
    expect(result.filteredCount).toBe(1);
  });

  // 유형 필터가 '전체'면 스테이 제외 가드만이 스테이를 걸러낼 수 있다.
  // 위 테스트는 activeType이 '고택·종택'이라 가드가 고장나도 통과해서,
  // type 문자열이 서비스와 어긋난 채 오래 남아 있었다.
  it('excludes stays even when no type filter is applied', () => {
    const villages = [village('house', '고택·종택'), village('stay', STAY_TYPE)];

    const result = getHanokGridPage(villages, { activeType: '전체', activeBadges: [] }, 1);

    expect(result.items.map((item) => item.id)).toEqual(['house']);
    expect(result.filteredCount).toBe(1);
  });

  // 유형 칩은 실제 데이터의 type과 완전일치해야 한다. 예전엔 칩이 '궁궐 한옥',
  // 데이터가 '궁궐·누각'이라 7개 칩 전부가 0건이었다.
  it('matches the type values the archive service actually emits', () => {
    const villages = [
      village('palace', '궁궐·누각'),
      village('house', '고택·종택'),
      village('stay', STAY_TYPE),
    ];

    const result = getHanokGridPage(villages, { activeType: '궁궐·누각', activeBadges: [] }, 1);

    expect(result.items.map((item) => item.id)).toEqual(['palace']);
  });
});
