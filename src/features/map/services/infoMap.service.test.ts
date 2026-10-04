import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('@/lib/api/client', () => ({
  USE_MOCK: false,
  apiRequest,
}));

import { listInfoPlaces, loadMapViewport } from './infoMap.service';

describe('infoMap.service category contract', () => {
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
      category: 'all',
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
      category: 'all',
    })).rejects.toThrow('Invalid map viewport response');
  });
});
