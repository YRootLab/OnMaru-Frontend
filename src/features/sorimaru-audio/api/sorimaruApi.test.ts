import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import { createSorimaruApiAdapter } from './sorimaruApi';

describe('Sorimaru API compatibility boundary', () => {
  it('delegates the supported cursor list without fetching details', async () => {
    const page = { items: [], totalCount: 20, nextCursor: 'cursor-2', hasMore: true };
    const repository = {
      listStories: vi.fn().mockResolvedValue(page),
      getStoryDetail: vi.fn(),
      listRegionGroups: vi.fn(),
      searchStoriesByKeyword: vi.fn(),
      listNearbyStories: vi.fn(),
      getRecommendations: vi.fn(),
    } satisfies SorimaruRepository;
    const adapter = createSorimaruApiAdapter(repository);
    const query = { language: 'ko-KR', category: 'HISTORIC', limit: 12 };

    await expect(adapter.listStories(query)).resolves.toEqual(page);
    expect(repository.listStories).toHaveBeenCalledExactlyOnceWith(query, undefined);
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
  });

  it('propagates detail failure from the backend repository', async () => {
    const repository = {
      listStories: vi.fn(),
      getStoryDetail: vi.fn().mockRejectedValue(new Error('detail unavailable')),
      listRegionGroups: vi.fn(),
      searchStoriesByKeyword: vi.fn(),
      listNearbyStories: vi.fn(),
      getRecommendations: vi.fn(),
    } satisfies SorimaruRepository;
    const adapter = createSorimaruApiAdapter(repository);

    await expect(adapter.getStoryDetail('story-1')).rejects.toThrow('detail unavailable');
    expect(repository.getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', undefined, undefined);
    expect(repository.listStories).not.toHaveBeenCalled();
  });
});
