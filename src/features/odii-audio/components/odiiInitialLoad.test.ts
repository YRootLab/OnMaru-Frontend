import { describe, expect, it, vi } from 'vitest';
import type { IOdiiApiService, OdiiStoryItem, OdiiStoryPage } from '../types/odii.types';
import { loadOdiiInitialData } from './odiiInitialLoad';

const stories = Array.from({ length: 9 }, (_, index) => ({
  stid: `story-${index}`,
  title: `Story ${index}`,
} as OdiiStoryItem));

const archive: OdiiStoryPage = {
  items: stories,
  pageNo: 1,
  numOfRows: 12,
  totalCount: stories.length,
  source: 'api',
};

describe('loadOdiiInitialData', () => {
  it('derives hero stories from the first archive request', async () => {
    const service = {
      getStoryPage: vi.fn().mockResolvedValue(archive),
      getStoryList: vi.fn(),
      getNearbyStories: vi.fn().mockResolvedValue([stories[8]]),
    } satisfies IOdiiApiService;

    const result = await loadOdiiInitialData(service);

    expect(service.getStoryPage).toHaveBeenCalledWith('전체', '', 1, 12);
    expect(service.getStoryPage).toHaveBeenCalledTimes(1);
    expect(service.getStoryList).not.toHaveBeenCalled();
    expect(result.heroStories).toEqual(stories.slice(0, 7));
    expect(result.nearbyStories).toEqual([stories[8]]);
    expect(result.archiveError).toBeNull();
    expect(result.nearbyError).toBeNull();
  });

  it('keeps archive data when only the nearby request fails', async () => {
    const service = {
      getStoryPage: vi.fn().mockResolvedValue(archive),
      getStoryList: vi.fn(),
      getNearbyStories: vi.fn().mockRejectedValue(new Error('nearby unavailable')),
    } satisfies IOdiiApiService;

    const result = await loadOdiiInitialData(service);

    expect(result.archive).toEqual(archive);
    expect(result.heroStories).toEqual(stories.slice(0, 7));
    expect(result.nearbyStories).toEqual([]);
    expect(result.nearbyError?.message).toBe('nearby unavailable');
  });
});
