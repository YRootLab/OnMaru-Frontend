import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import { createSorimaruNetworkClient, fetchSorimaruRegionGroups } from './sorimaruNetwork';

const page = { items: [], nextCursor: null, hasMore: false };

describe('Sorimaru network compatibility boundary', () => {
  it('delegates cursor lists to the backend repository without public requests', async () => {
    const repository = {
      listStories: vi.fn().mockResolvedValue(page),
      getStoryDetail: vi.fn(),
      listRegionGroups: vi.fn(),
      searchStoriesByKeyword: vi.fn(),
      listNearbyStories: vi.fn(),
      getRecommendations: vi.fn(),
    } satisfies SorimaruRepository;
    const client = createSorimaruNetworkClient(repository);
    const query = { language: 'ko-KR', limit: 12, cursor: 'next-page' };

    await expect(client.listStories(query)).resolves.toEqual(page);
    expect(repository.listStories).toHaveBeenCalledExactlyOnceWith(query, undefined);
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
  });

  it('propagates backend errors', async () => {
    const repository = {
      listStories: vi.fn().mockRejectedValue(new Error('backend unavailable')),
      getStoryDetail: vi.fn(),
      listRegionGroups: vi.fn(),
      searchStoriesByKeyword: vi.fn(),
      listNearbyStories: vi.fn(),
      getRecommendations: vi.fn(),
    } satisfies SorimaruRepository;
    const client = createSorimaruNetworkClient(repository);

    await expect(client.listStories({ language: 'ko-KR', limit: 12 })).rejects.toThrow('backend unavailable');
  });

  it('gets regions through the repository', async () => {
    const groups = { groups: [{ label: '수도권', regionCodes: ['11'], storyCount: 1 }] };
    const repository = {
      listStories: vi.fn(),
      getStoryDetail: vi.fn(),
      listRegionGroups: vi.fn().mockResolvedValue(groups),
      searchStoriesByKeyword: vi.fn(),
      listNearbyStories: vi.fn(),
      getRecommendations: vi.fn(),
    } satisfies SorimaruRepository;

    await expect(fetchSorimaruRegionGroups('ko-KR', repository)).resolves.toEqual(groups);
    expect(repository.listRegionGroups).toHaveBeenCalledExactlyOnceWith('ko-KR');
  });
});
