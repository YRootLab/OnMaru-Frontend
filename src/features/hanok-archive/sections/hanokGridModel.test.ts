import { describe, expect, it } from 'vitest';
import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village } from '@/features/hanok-archive/types';
import { EMPTY_FILTERS, getHanokGridPage, type HanokFilters } from './hanokGridModel';

function village(
  id: string,
  type: Village['type'] = '고택',
  badges: string[] = [],
  extra: Partial<Village> = {},
): Village {
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
    ...extra,
  };
}

const filters = (patch: Partial<HanokFilters> = {}): HanokFilters => ({
  ...EMPTY_FILTERS,
  ...patch,
});

describe('getHanokGridPage', () => {
  it('keeps stable ids and a twelve-item page', () => {
    const villages = Array.from({ length: 14 }, (_, index) => village(`v-${index}`));
    const first = getHanokGridPage(villages, filters(), 1);
    const second = getHanokGridPage(villages, filters(), 1);

    expect(first.items).toHaveLength(12);
    expect(second.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));
    expect(first.totalPages).toBe(2);
  });



  it('keeps places matching any selected badge', () => {
    const villages = [
      village('both', '고택', ['고택', '국가지정']),
      village('one', '고택', ['고택']),
      village('other', '고택', ['국가지정']),
      village('none', '고택', ['돌담길']),
    ];

    const result = getHanokGridPage(
      villages,
      filters({ activeType: '고택', activeBadges: ['고택', '국가지정'] }),
      1,
    );

    expect(result.items.map((item) => item.id)).toEqual(['both', 'one', 'other']);
    expect(result.filteredCount).toBe(3);
  });


  it('excludes stays even when no type filter is applied', () => {
    const villages = [village('house', '고택'), village('stay', STAY_TYPE)];

    const result = getHanokGridPage(villages, filters(), 1);

    expect(result.items.map((item) => item.id)).toEqual(['house']);
    expect(result.filteredCount).toBe(1);
  });



  it('matches the type values the archive service actually emits', () => {
    const villages = [
      village('palace', '고궁'),
      village('house', '고택'),
      village('stay', STAY_TYPE),
    ];

    const result = getHanokGridPage(villages, filters({ activeType: '고궁' }), 1);

    expect(result.items.map((item) => item.id)).toEqual(['palace']);
  });

  it('filters by region', () => {
    const villages = [
      village('seoul', '고택', [], { region: '서울' }),
      village('andong', '고택', [], { region: '경북' }),
    ];

    const result = getHanokGridPage(villages, filters({ region: '경북' }), 1);

    expect(result.items.map((item) => item.id)).toEqual(['andong']);
  });

  it('searches name and address, ignoring spacing', () => {
    const villages = [
      village('namsan', '민속마을', [], { name: '남산골한옥마을', addr: '서울 중구' }),
      village('bukchon', '민속마을', [], { name: '북촌한옥마을', addr: '서울 종로구' }),
      village('unjoru', '고택', [], { name: '구례 운조루', addr: '전남 구례군' }),
    ];


    expect(
      getHanokGridPage(villages, filters({ query: '남산골 한옥마을' }), 1).items.map((i) => i.id),
    ).toEqual(['namsan']);


    expect(
      getHanokGridPage(villages, filters({ query: '구례' }), 1).items.map((i) => i.id),
    ).toEqual(['unjoru']);
  });





  it('pulls an out-of-range page back to the last page that has items', () => {
    const villages = Array.from({ length: 14 }, (_, index) => village(`v-${index}`));

    const result = getHanokGridPage(villages, filters(), 5);

    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('reports zero pages without crashing when nothing matches', () => {
    const result = getHanokGridPage([village('only')], filters({ query: '없는이름' }), 3);

    expect(result.items).toEqual([]);
    expect(result.filteredCount).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
