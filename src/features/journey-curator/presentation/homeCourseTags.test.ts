import { describe, expect, it } from 'vitest';
import { buildHomeCourseTags, getHomeCourseCategoryLabel } from './homeCourseTags';

describe('getHomeCourseCategoryLabel', () => {
  it.each([
    ['HANOK', '한옥'],
    ['HANOK_EXPERIENCE', '한옥 체험'],
    ['HANOK_CAFE', '한옥 카페'],
    ['HANOK_STAY', '한옥 숙박'],
    ['CULTURE_ART', '문화 예술'],
    ['TRADITIONAL_FOOD', '전통 음식'],
    ['GARDEN_ECOLOGY', '정원 생태'],
    ['LOCAL_SCENE', '지역 생활'],
  ])('maps %s to %s', (category, label) => {
    expect(getHomeCourseCategoryLabel(category)).toBe(label);
  });

  it('falls back for missing or unknown English category codes', () => {
    expect(getHomeCourseCategoryLabel('UNKNOWN_CODE')).toBe('추천 장소');
    expect(getHomeCourseCategoryLabel('')).toBe('추천 장소');
    expect(getHomeCourseCategoryLabel(null)).toBe('추천 장소');
  });

  it('preserves an already-Korean category', () => {
    expect(getHomeCourseCategoryLabel('전통시장')).toBe('전통시장');
  });
});

describe('buildHomeCourseTags', () => {
  it('normalizes, deduplicates, and limits regular course tags to three chips', () => {
    expect(buildHomeCourseTags({
      category: 'HANOK',
      tags: ['#한옥', '  고택  ', '#고택', '산책', '사진'],
    })).toEqual([
      { label: '한옥', kind: 'category' },
      { label: '고택', kind: 'content' },
      { label: '산책', kind: 'content' },
    ]);
  });

  it('reserves the third chip for a saved course', () => {
    expect(buildHomeCourseTags({
      category: 'HANOK_CAFE',
      tags: ['#한옥 카페', '#차', '#디저트'],
      savedByMe: true,
    })).toEqual([
      { label: '한옥 카페', kind: 'category' },
      { label: '차', kind: 'content' },
      { label: '저장됨', kind: 'saved' },
    ]);
  });

  it('ignores blank tags and collapses internal whitespace', () => {
    expect(buildHomeCourseTags({
      category: 'LOCAL_SCENE',
      tags: ['###', '  골목   산책  '],
    })).toEqual([
      { label: '지역 생활', kind: 'category' },
      { label: '골목 산책', kind: 'content' },
    ]);
  });
});
