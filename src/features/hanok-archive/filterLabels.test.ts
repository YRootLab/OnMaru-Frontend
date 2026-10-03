import { describe, expect, it } from 'vitest';
import { filterLabel } from './filterLabels';

describe('filterLabel', () => {
  it.each([
    ['CULTURE_ART', '문화·예술'],
    ['HANOK', '한옥'],
    ['HANOK_EXPERIENCE', '한옥 체험'],
    ['HANOK_STAY', '한옥스테이'],
    ['HISTORIC_SITE', '역사 유적'],
    ['LEISURE_ACTIVITY', '레저 활동'],
    ['LOCAL_SCENE', '지역 생활'],
  ])('converts the backend category code %s to the Korean label %s', (category, label) => {
    expect(filterLabel(category)).toBe(label);
  });

  it('keeps an unknown category readable instead of hiding it', () => {
    expect(filterLabel('새 분류')).toBe('새 분류');
  });
});
