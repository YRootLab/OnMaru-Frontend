import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

const tourApiGetMock = vi.fn();
vi.mock('@/lib/tour-api/tourApiClient', () => ({
  TourApiClient: { get: (...args: unknown[]) => tourApiGetMock(...args) },
}));

describe('PlaceService.getNearbyPlaces backend-first (FE #90)', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    apiGetMock.mockReset();
    tourApiGetMock.mockReset();
    tourApiGetMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalApiUrl === undefined) { delete process.env.NEXT_PUBLIC_API_URL; } else { process.env.NEXT_PUBLIC_API_URL = originalApiUrl; }
    vi.resetModules();
  });

  it('uses backend /map/places for an unfiltered query when it returns results', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({
      items: [
        {
          placeId: 'p-1',
          name: '전주 한옥마을',
          category: '한옥',
          region: { regionCode: 'kr-45-jeonju', name: '전북 전주시' },
          coordinates: { lat: 35.8151, lng: 127.153 },
          thumbnailUrl: null,
          summary: '설명',
          savedByMe: false,
        },
      ],
    });

    const { PlaceService } = await import('./place.service');
    const items = await PlaceService.getNearbyPlaces({ lat: 35.8151, lng: 127.153, radius: 3000 });

    expect(apiGetMock).toHaveBeenCalledWith('/map/places', expect.objectContaining({
      bbox: expect.stringMatching(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/),
      limit: 1000,
    }));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'p-1', name: '전주 한옥마을', category: 'spot', isTraditional: true });
    expect(tourApiGetMock).not.toHaveBeenCalled();
  });

  it('keeps canonical backend places for a nationwide viewport instead of replacing them with fallback ids', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({
      items: [
        {
          placeId: 'p-jeonju-hanok-village',
          name: '전주 한옥마을',
          category: '한옥',
          region: { regionCode: 'kr-45-jeonju', name: '전북 전주시' },
          coordinates: { lat: 35.8151, lng: 127.153 },
          thumbnailUrl: null,
          summary: '설명',
          savedByMe: false,
        },
      ],
    });

    const { PlaceService } = await import('./place.service');
    const items = await PlaceService.getNearbyPlaces({
      lat: 36.35,
      lng: 127.75,
      radius: 224_297,
    });

    expect(items.map((item) => item.id)).toEqual(['p-jeonju-hanok-village']);
  });

  it('falls back to TourAPI when the backend returns no items', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({ items: [] });

    const { PlaceService } = await import('./place.service');


    await PlaceService.getNearbyPlaces({ lat: 35.8151, lng: 127.153, radius: 3000 }).catch(() => {});

    expect(apiGetMock).toHaveBeenCalled();
    expect(tourApiGetMock).toHaveBeenCalled();
  });

  it('skips the backend entirely when a specific category filter is set', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';

    const { PlaceService } = await import('./place.service');
    await PlaceService.getNearbyPlaces({ lat: 35.8151, lng: 127.153, radius: 3000, category: 'food' }).catch(() => {});

    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it('uses backend when NEXT_PUBLIC_API_URL is set (prod regression #222)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({
      items: [
        {
          placeId: 'p-2',
          name: '경복궁',
          category: '문화유산',
          region: { regionCode: 'kr-11', name: '서울' },
          coordinates: { lat: 37.5796, lng: 126.977 },
          thumbnailUrl: null,
          summary: '조선 왕궁',
          savedByMe: false,
        },
      ],
    });

    const { PlaceService } = await import('./place.service');
    const items = await PlaceService.getNearbyPlaces({ lat: 37.5796, lng: 126.977, radius: 3000 });

    expect(apiGetMock).toHaveBeenCalled();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('p-2');
    expect(tourApiGetMock).not.toHaveBeenCalled();
  });

  it('maps festival, culture, experience, food, and market backend categories accurately', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    const base = {
      region: { regionCode: 'kr-11', name: '서울' },
      coordinates: { lat: 37.5796, lng: 126.977 },
      thumbnailUrl: null,
      summary: '설명',
      savedByMe: false,
    };
    apiGetMock.mockResolvedValue({
      items: [
        { ...base, placeId: 'p-fest', name: '궁중문화축전', category: '축제' },
        { ...base, placeId: 'p-cult', name: '국립고궁박물관', category: 'CULTURE_ART' },
        { ...base, placeId: 'p-exp', name: '전통 다도 체험', category: 'HANOK_EXPERIENCE' },
        { ...base, placeId: 'p-food', name: '전통 한정식', category: 'TRADITIONAL_FOOD' },
        { ...base, placeId: 'p-mkt', name: '통인시장', category: '시장' },
      ],
    });

    const { PlaceService } = await import('./place.service');
    const items = await PlaceService.getNearbyPlaces({ lat: 37.5796, lng: 126.977, radius: 5000 });

    expect(items.map((item) => [item.id, item.category])).toEqual([
      ['p-fest', 'festival'],
      ['p-cult', 'culture'],
      ['p-exp', 'experience'],
      ['p-food', 'food'],
      ['p-mkt', 'market'],
    ]);
  });
});
