import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('@/lib/api/client', () => ({
  USE_MOCK: false,
  apiRequest,
}));

import { listInfoPlaces, loadMapViewport } from './infoMap.service';

describe('infoMap.service category contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue({
      renderMode: 'DISTRICT',
      servedBbox: { west: 126, south: 36, east: 128, north: 38 },
      snapshotId: null,
      items: [],
      totalCountInViewport: 0,
    });
  });

  it('sends HANOK unchanged as one list category', async () => {
    await listInfoPlaces({ category: 'hanok' });

    expect(apiRequest).toHaveBeenCalledWith('/map/info/places', expect.objectContaining({
      params: expect.objectContaining({ category: 'HANOK', limit: '30' }),
    }));
  });

  it('normalizes the viewport category to the same server enum', async () => {
    await loadMapViewport({
      bbox: '126,36,128,38',
      zoomLevel: 9,
      category: 'hanok',
    });

    expect(apiRequest).toHaveBeenCalledWith('/map/info/viewport', expect.objectContaining({
      params: expect.objectContaining({ category: 'HANOK', limit: '60' }),
    }));
  });

  it.each(['all', '', 'unknown'])(
    'never sends the invalid %s category to either information endpoint',
    async (category) => {
      await listInfoPlaces({ category });
      await loadMapViewport({ bbox: '126,36,128,38', zoomLevel: 9, category });

      expect(apiRequest).toHaveBeenNthCalledWith(1, '/map/info/places', expect.objectContaining({
        params: expect.objectContaining({ category: 'HANOK' }),
      }));
      expect(apiRequest).toHaveBeenNthCalledWith(2, '/map/info/viewport', expect.objectContaining({
        params: expect.objectContaining({ category: 'HANOK' }),
      }));
    },
  );

  it('uses the Spring API even when an old preview URL is opened', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('window', { location: { search: '?mockMap=50' } });

    await listInfoPlaces({ category: 'hanok' });
    await loadMapViewport({ bbox: '124,32,131,39', zoomLevel: 5, category: 'hanok' });

    expect(apiRequest).toHaveBeenCalledWith('/map/info/places', expect.objectContaining({
      params: expect.objectContaining({ category: 'HANOK' }),
    }));
    expect(apiRequest).toHaveBeenCalledWith('/map/info/viewport', expect.objectContaining({
      params: expect.objectContaining({ category: 'HANOK' }),
    }));
  });

  it('normalizes Spring place categories for the existing list UI', async () => {
    apiRequest.mockResolvedValue({
      items: [{ placeId: 'place-1', name: '한옥', displayCategory: 'HANOK_STAY', coordinates: { lat: 36, lng: 127 } }],
    });

    const page = await listInfoPlaces({ category: 'hanok' });

    expect(page.items[0].category).toBe('HANOK_STAY');
  });

  it('normalizes Spring cluster ids, category names, and empty cluster labels', async () => {
    apiRequest.mockResolvedValue({
      renderMode: 'CLUSTER',
      servedBbox: { west: 126, south: 36, east: 128, north: 38 },
      snapshotId: null,
      items: [
        { type: 'CLUSTER', id: 'cluster:6:0:4', name: null, center: { lat: 36.3, lng: 127.4 }, count: 8 },
        { type: 'PLACE', id: 'place-1', placeId: 'place-1', name: '한옥', displayCategory: 'HANOK_STAY', center: { lat: 36.4, lng: 127.5 }, count: 1 },
      ],
    });

    const response = await loadMapViewport({ bbox: '126,36,128,38', zoomLevel: 6, category: 'hanok' });

    expect(response.items[0]).toMatchObject({ clusterId: 'cluster:6:0:4', name: '주변 장소' });
    expect(response.items[1]).toMatchObject({ category: 'HANOK_STAY', name: '한옥' });
  });

  it('accepts the backend object bbox and nullable compatibility snapshot id', async () => {
    apiRequest.mockResolvedValue({
      renderMode: 'DISTRICT',
      servedBbox: { west: 126, south: 36, east: 128, north: 38 },
      snapshotId: null,
      items: [],
      totalCountInViewport: 0,
    });

    await expect(loadMapViewport({
      bbox: '126,36,128,38',
      zoomLevel: 9,
      category: 'hanok',
    })).resolves.toMatchObject({
      servedBbox: { west: 126, south: 36, east: 128, north: 38 },
      snapshotId: null,
    });
  });

  it('rejects a malformed viewport bbox before presentation code can crash', async () => {
    apiRequest.mockResolvedValue({
      renderMode: 'DISTRICT',
      servedBbox: '126,36,128,38',
      snapshotId: null,
      items: [],
      totalCountInViewport: 0,
    });

    await expect(loadMapViewport({
      bbox: '126,36,128,38',
      zoomLevel: 9,
      category: 'hanok',
    })).rejects.toThrow('Invalid map viewport response');
  });
});
