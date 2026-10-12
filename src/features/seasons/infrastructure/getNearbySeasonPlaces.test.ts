import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNearbySeasonPlaces } from './getNearbySeasonPlaces';

describe('getNearbySeasonPlaces', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('uses the published backend distance query and excludes non-hanok results', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const fetcher = vi.fn(async (_url: string) => ({ ok: true, json: async () => ({ items: [
      { placeId: 'p-tourapi-111', name: '새 고택', displayCategory: 'HANOK_STAY', summary: '안동시 길 1', region: { name: '안동' }, coordinates: { lat: 36.5, lng: 128.5 }, thumbnailUrl: 'http://example.com/a.jpg' },
      { placeId: 'p-tourapi-222', name: '카페', displayCategory: 'HANOK_CAFE', coordinates: { lat: 36.5, lng: 128.5 } },
    ] }) }));
    vi.stubGlobal('fetch', fetcher);
    const result = await getNearbySeasonPlaces([{ id: '1877312', lat: 36.58, lng: 128.54 }]);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/map/info/places');
    expect(url.searchParams.get('sort')).toBe('DISTANCE');
    expect(url.searchParams.get('category')).toBe('HANOK');
    expect(result.get('1877312')?.map((item) => item.placeId)).toEqual(['p-tourapi-111']);
  });
});
