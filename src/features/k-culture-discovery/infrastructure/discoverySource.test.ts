import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api/client';
import { fetchDiscoveryPlaces, fetchDiscoveryTopics } from './discoverySource';

vi.mock('@/lib/api/client', () => ({ apiGet: vi.fn() }));

describe('discovery API source', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the backend response for topics', async () => {
    const response = { items: [{ code: 'K_DRAMA', active: true, placeCount: 1 }] };
    vi.mocked(apiGet).mockResolvedValue(response);

    await expect(fetchDiscoveryTopics()).resolves.toEqual(response.items);
    expect(apiGet).toHaveBeenCalledWith('/api/v1/discovery/topics');
  });

  it('propagates backend errors instead of showing fixture places', async () => {
    const error = new Error('Backend unavailable');
    vi.mocked(apiGet).mockRejectedValue(error);

    await expect(fetchDiscoveryPlaces({ limit: 20 })).rejects.toBe(error);
    expect(apiGet).toHaveBeenCalledWith('/api/v1/discovery/places', { limit: '20' });
  });
});
