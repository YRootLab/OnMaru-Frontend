import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

const tourApiGetMock = vi.fn();
vi.mock('@/lib/tour-api/tourApiClient', () => ({
  TourApiClient: { get: (...args: unknown[]) => tourApiGetMock(...args) },
}));

describe('PlaceService.getNearbyPlaces backend-first (FE #90)', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    apiGetMock.mockReset();
    tourApiGetMock.mockReset();
    tourApiGetMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalApiUrl === undefined) { delete process.env.NEXT_PUBLIC_API_URL; } else { process.env.NEXT_PUBLIC_API_URL = originalApiUrl; }
    if (originalApiBaseUrl === undefined) { delete process.env.NEXT_PUBLIC_API_BASE_URL; } else { process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl; }
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

  it('uses backend when only NEXT_PUBLIC_API_BASE_URL is set (prod regression #222)', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.onmaru.test';
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
});
