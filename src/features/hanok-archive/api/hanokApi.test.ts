import { describe, expect, it } from 'vitest';
import { createHanokRepository } from './hanokApi';

describe('hanok repository', () => {
  it('calls the backend contract paths with the right params (FE #90)', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createHanokRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      if (path === '/hanoks') {
        return { schemaVersion: '1.2', items: [], nextCursor: null, hasMore: false };
      }
      if (path === '/places/p-jeonju-hanok-village') {
        return { schemaVersion: '1.2', placeId: 'p-jeonju-hanok-village' };
      }
      return { schemaVersion: '1.2', coverageStatus: 'PARTIAL', language: 'ko-KR', items: [], nextCursor: null, hasMore: false };
    }) as never);

    await repository.listHanoks({ keyword: '북촌', limit: 20 });
    await repository.getPlaceDetail('p-jeonju-hanok-village');
    await repository.listMapPlaces({ swLat: 37.4, swLng: 126.8, neLat: 37.7, neLng: 127.1 });

    expect(calls).toEqual([
      { path: '/hanoks', options: { method: 'GET', params: { keyword: '북촌', limit: 20 }, cache: 'no-store' } },
      { path: '/places/p-jeonju-hanok-village', options: { method: 'GET', cache: 'no-store' } },
      {
        path: '/map/places',
        options: {
          method: 'GET',
          params: { swLat: 37.4, swLng: 126.8, neLat: 37.7, neLng: 127.1 },
          cache: 'no-store',
        },
      },
    ]);
  });
});
