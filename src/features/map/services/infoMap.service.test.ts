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
    apiRequest.mockResolvedValue({});
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
      params: expect.objectContaining({ category: 'HANOK' }),
    }));
  });
});
