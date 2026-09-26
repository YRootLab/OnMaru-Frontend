import { describe, expect, it } from 'vitest';
import type { StampBookResponse, StampCatalogResponse } from './models';
import {
  mergeStampCatalog,
  resolveAwardStamps,
  resolveStampBookViewState,
  stampErrorMessage,
} from './stampRules';

const catalog: StampCatalogResponse = {
  schemaVersion: '1.3',
  stamps: [
    {
      code: 'stamp_bukchon',
      name: '북촌 한옥마을 인장',
      description: '북촌을 방문한 기록',
      conditionLabel: '북촌 일대 한옥 방문',
      sealText: '北村',
      iconName: 'Landmark',
      color: '#b91c1c',
      rarity: 'COMMON',
      conditionType: 'REGION_VISIT',
      requiredCount: null,
      regionGroup: 'SEOUL',
      sortOrder: 1,
    },
    {
      code: 'stamp_national_master',
      name: '팔도 유람 팔도어보',
      description: '다섯 권역을 방문한 기록',
      conditionLabel: '서로 다른 5개 권역 방문',
      sealText: '八道',
      iconName: 'Trophy',
      color: '#d4940a',
      rarity: 'LEGENDARY',
      conditionType: 'REGION_COUNT',
      requiredCount: 5,
      regionGroup: null,
      sortOrder: 12,
    },
  ],
};

const book: StampBookResponse = {
  schemaVersion: '1.3',
  summary: {
    collectedCount: 1,
    totalCount: 12,
    visitedRegionCount: 1,
    requiredRegionCount: 5,
    completionRate: 8,
  },
  stamps: [
    {
      code: 'stamp_bukchon',
      name: '북촌 한옥마을 인장',
      rarity: 'COMMON',
      regionGroup: 'SEOUL',
      conditionLabel: '북촌 일대 한옥 방문',
      description: '북촌을 방문한 기록',
      sealText: '北村',
      iconName: 'Landmark',
      color: '#b91c1c',
      sortOrder: 1,
      collected: true,
      collectedAt: '2026-09-27T01:30:00Z',
      triggerPlaceId: 'place-bukchon',
    },
    {
      code: 'stamp_national_master',
      name: '팔도 유람 팔도어보',
      rarity: 'LEGENDARY',
      regionGroup: null,
      conditionLabel: '서로 다른 5개 권역 방문',
      description: '다섯 권역을 방문한 기록',
      sealText: '八道',
      iconName: 'Trophy',
      color: '#d4940a',
      sortOrder: 12,
      collected: false,
      collectedAt: null,
      triggerPlaceId: null,
    },
  ],
};

describe('stamp domain rules', () => {
  it('uses personal collection state and preserves the server summary', () => {
    const result = mergeStampCatalog(catalog, book);

    expect(result.stamps[0]).toMatchObject({
      id: 'stamp_bukchon',
      rarity: 'common',
      region: 'seoul',
      collected: {
        stampId: 'stamp_bukchon',
        placeId: 'place-bukchon',
        collectedAt: '2026-09-27T01:30:00Z',
      },
    });
    expect(result.stamps[1].collected).toBeNull();
    expect(result.summary).toEqual(book.summary);
  });

  it('keeps every public stamp locked for a guest', () => {
    const result = mergeStampCatalog(catalog, null);

    expect(result.stamps.every((stamp) => stamp.collected === null)).toBe(true);
    expect(result.summary).toEqual({
      collectedCount: 0,
      totalCount: 2,
      visitedRegionCount: 0,
      requiredRegionCount: 5,
      completionRate: 0,
    });
  });

  it('resolves every awarded code in response order from the server catalog', () => {
    const awards = resolveAwardStamps(catalog, [
      {
        code: 'stamp_national_master',
        name: '팔도 유람 팔도어보',
        sealText: '八道',
        rarity: 'LEGENDARY',
        collectedAt: '2026-09-27T02:00:00Z',
      },
      {
        code: 'stamp_bukchon',
        name: '북촌 한옥마을 인장',
        sealText: '北村',
        rarity: 'COMMON',
        collectedAt: '2026-09-27T02:00:00Z',
      },
    ]);

    expect(awards.map((stamp) => stamp.id)).toEqual([
      'stamp_national_master',
      'stamp_bukchon',
    ]);
  });

  it('selects Korean guidance by stable error code and appends a request id', () => {
    expect(stampErrorMessage({
      code: 'OUTSIDE_CHECK_IN_RADIUS',
      requestId: 'req-42',
    })).toBe('장소 가까이 이동한 뒤 다시 시도해 주세요. (문의 코드: req-42)');

    expect(stampErrorMessage({
      code: 'GEOLOCATION_TIMEOUT',
      requestId: null,
    })).toBe('위치 확인 시간이 초과됐어요. 다시 시도해 주세요.');
  });

  it('does not expose a guest-looking book while authentication or personal data is loading', () => {
    expect(resolveStampBookViewState({
      authLoading: true,
      loggedIn: false,
      hasCatalog: true,
      hasBook: false,
      catalogError: false,
      bookError: false,
    })).toBe('loading');

    expect(resolveStampBookViewState({
      authLoading: false,
      loggedIn: true,
      hasCatalog: true,
      hasBook: false,
      catalogError: false,
      bookError: false,
    })).toBe('loading');
  });

  it('keeps public catalog failures separate from personal book failures', () => {
    expect(resolveStampBookViewState({
      authLoading: false,
      loggedIn: false,
      hasCatalog: false,
      hasBook: false,
      catalogError: true,
      bookError: false,
    })).toBe('catalog-error');

    expect(resolveStampBookViewState({
      authLoading: false,
      loggedIn: true,
      hasCatalog: true,
      hasBook: false,
      catalogError: false,
      bookError: true,
    })).toBe('book-error');
  });
});
