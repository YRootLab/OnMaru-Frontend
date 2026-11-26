import { describe, expect, it } from 'vitest';
import {
  getLocalizedWorkTitle,
  getRegionFallbackLabel,
  resolveRegionKey,
  selectFeaturedPlaces,
} from './discoveryPresentation';
import type { DiscoveryPlaceSummary } from './types';

function makePlace(
  id: string,
  opts: { hasImage?: boolean; hasRelation?: boolean } = {},
): DiscoveryPlaceSummary {
  return {
    placeId: id,
    name: `Place ${id}`,
    region: { code: '1', nameKo: '서울특별시' },
    placeRoles: [],
    topics: ['K_DRAMA'],
    placeImage: opts.hasImage ? `https://example.com/${id}.jpg` : null,
    odiiLinked: false,
    featuredRelation: opts.hasRelation
      ? {
          relationId: `rel-${id}`,
          workId: `work-${id}`,
          workTitle: `Work ${id}`,
          type: 'DRAMA',
          relationType: 'FILMING_LOCATION',
        }
      : null,
    matchingWorkCount: opts.hasRelation ? 1 : 0,
    saveAvailable: true,
    savedByMe: false,
  };
}

describe('discoveryPresentation domain helpers', () => {
  it('resolves canonical region keys from codes and Korean names', () => {
    expect(resolveRegionKey({ code: '1', nameKo: '서울특별시' })).toBe('seoul');
    expect(resolveRegionKey({ code: '50', nameKo: '제주특별자치도' })).toBe('jeju');
    expect(resolveRegionKey({ code: '', nameKo: '충청북도' })).toBe('chungbuk');
    expect(resolveRegionKey({ code: '', nameKo: '강원특별자치도' })).toBe('gangwon');
    expect(resolveRegionKey({ code: '999', nameKo: '미지의 지역' })).toBeNull();
    expect(getRegionFallbackLabel({ code: '999', nameKo: '경상북도' })).toBe('경상북');
  });

  it('prioritizes items with both image and featuredRelation for the hero carousel', () => {
    const items = [
      makePlace('1'),
      makePlace('2', { hasImage: true }),
      makePlace('3', { hasRelation: true }),
      makePlace('4', { hasImage: true, hasRelation: true }),
      makePlace('5', { hasImage: true, hasRelation: true }),
      makePlace('6', { hasImage: true }),
      makePlace('7', { hasRelation: true }),
      makePlace('8'),
    ];

    const { featured, rest } = selectFeaturedPlaces(items, 5);
    expect(featured.map((p) => p.placeId)).toEqual(['4', '5', '3', '7', '2']);
    expect(rest.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps rest populated when dataset is small', () => {
    const items = [
      makePlace('1', { hasImage: true, hasRelation: true }),
      makePlace('2', { hasRelation: true }),
      makePlace('3', { hasRelation: true }),
      makePlace('4', { hasRelation: true }),
    ];

    const { featured, rest } = selectFeaturedPlaces(items, 5);
    expect(featured).toHaveLength(3);
    expect(rest.map((p) => p.placeId)).toEqual(['2', '3', '4']);
  });

  it('returns English title as primary for non-Korean locales when available', () => {
    expect(
      getLocalizedWorkTitle({ canonicalTitle: '도깨비', englishTitle: 'Goblin' }, 'en'),
    ).toEqual({ primary: 'Goblin', secondary: '도깨비' });

    expect(
      getLocalizedWorkTitle({ canonicalTitle: '도깨비', englishTitle: 'Goblin' }, 'ko'),
    ).toEqual({ primary: '도깨비', secondary: null });

    expect(
      getLocalizedWorkTitle({ canonicalTitle: '도깨비', englishTitle: null }, 'ja'),
    ).toEqual({ primary: '도깨비', secondary: null });
  });
});
