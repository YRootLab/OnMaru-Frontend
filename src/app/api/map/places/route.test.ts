import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getNearbyPlaces: vi.fn(), seedWarmth: vi.fn() }));

vi.mock('@/features/map/services/place.service', () => ({
  PLACE_CATEGORIES: [],
  PlaceService: { getNearbyPlaces: mocks.getNearbyPlaces },
}));
vi.mock('@/features/map/warmth/seed', () => ({ seedWarmth: mocks.seedWarmth }));

import { GET } from './route';

beforeEach(() => {
  mocks.getNearbyPlaces.mockReset();
  mocks.seedWarmth.mockReset().mockReturnValue([]);
});

describe('GET /api/map/places', () => {
  it('returns HTTP 400 for invalid coordinates', async () => {
    const response = await GET(new Request('http://localhost/api/map/places?lat=bad&lng=127'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_COORDINATES' } });
  });

  it('returns a structured 503 when upstream and fallback have no usable data', async () => {
    mocks.getNearbyPlaces.mockRejectedValue(new Error('upstream down'));
    const response = await GET(new Request('http://localhost/api/map/places?lat=37.5&lng=127&radius=3000'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      items: [],
      degraded: true,
      error: { code: 'MAP_PLACES_UNAVAILABLE' },
    });
  });

  it('keeps usable fallback places with degraded metadata and HTTP 200', async () => {
    mocks.getNearbyPlaces.mockRejectedValue(new Error('upstream down'));
    mocks.seedWarmth.mockReturnValue([
      {
        id: 'warmth-1',
        placeId: 'place-1',
        placeName: '테스트 한옥',
        lat: 37.5,
        lng: 127,
        text: '조용한 마당이에요',
        mood: '한적',
        createdAt: '2026-10-03T00:00:00.000Z',
      },
    ]);

    const response = await GET(new Request('http://localhost/api/map/places?lat=37.5&lng=127'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      degraded: true,
      items: [{ id: 'place-1', name: '테스트 한옥' }],
      error: { code: 'MAP_PLACES_UNAVAILABLE' },
    });
  });
});
