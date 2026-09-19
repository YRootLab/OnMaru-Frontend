import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

const tourApiGetMock = vi.fn();
vi.mock('@/lib/tour-api/tourApiClient', () => ({
  TourApiClient: { get: (...args: unknown[]) => tourApiGetMock(...args) },
}));

describe('PlaceService.getNearbyPlaces backend-first (FE #90)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    apiGetMock.mockReset();
    tourApiGetMock.mockReset();
    tourApiGetMock.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
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
      swLat: expect.any(Number),
      swLng: expect.any(Number),
      neLat: expect.any(Number),
      neLng: expect.any(Number),
    }));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'p-1', name: '전주 한옥마을', category: 'spot', isTraditional: true });
    expect(tourApiGetMock).not.toHaveBeenCalled();
  });

  it('falls back to TourAPI when the backend returns no items', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({ items: [] });

    const { PlaceService } = await import('./place.service');
    // TourAPI 키가 없는 테스트 환경에서는 폴백 경로 자체가 던진다 — 여기서
    // 검증하려는 건 "폴백이 실제로 호출됐는가"뿐이라 그 예외는 삼킨다.
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
});
