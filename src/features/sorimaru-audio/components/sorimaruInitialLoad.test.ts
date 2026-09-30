import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryPage, SorimaruStorySummary } from '../domain/sorimaruStory';
import { createSorimaruCatalogController } from '../hooks/useSorimaruCatalog';
import { findNearbySorimaruStories, loadSorimaruInitialData, loadedEditorialRailStories, loadNextSorimaruPage, resolveSorimaruSelectionIntent } from './sorimaruInitialLoad';

const stories: SorimaruStorySummary[] = Array.from({ length: 9 }, (_, index) => ({
  storyId: `story-${index}`,
  title: `Story ${index}`,
  audioTitle: `Audio ${index}`,
  category: '한옥',
  region: { regionCode: 'kr-11', name: '서울특별시', level: 'PROVINCE', parentRegionCode: null },
  coordinates: null,
  durationSeconds: 180,
  imageUrl: null,
  linkedPlaceId: null,
  contentTags: [],
  savedByMe: false,
}));

const firstPage: SorimaruStoryPage = { items: stories, nextCursor: 'cursor-2', hasMore: true };

describe('Section 2 loaded summaries', () => {
  it('keeps 17 unique stories across two loaded pages when the archive changes page', async () => {
    const pageOneItems = Array.from({ length: 12 }, (_, index) => ({ ...stories[0], storyId: `rail-${index + 1}` }));
    const pageTwoItems = Array.from({ length: 5 }, (_, index) => ({ ...stories[0], storyId: `rail-${index + 13}` }));
    const pages: SorimaruStoryPage[] = [
      { items: pageOneItems, nextCursor: 'cursor-2', hasMore: true },
      { items: [pageOneItems[11], ...pageTwoItems], nextCursor: null, hasMore: false },
    ];
    const catalog = createSorimaruCatalogController(repositoryWith(vi.fn().mockResolvedValue(pages[1])), pages[0]);
    await catalog.loadInitial();
    await catalog.goToPage(2);
    expect(catalog.getSnapshot().currentPage).toBe(2);
    const secondPageRailIds = loadedEditorialRailStories(catalog.getSnapshot().catalog.pages).map((story) => story.storyId);

    await catalog.goToPage(1);
    expect(catalog.getSnapshot().currentPage).toBe(1);
    const firstPageRailIds = loadedEditorialRailStories(catalog.getSnapshot().catalog.pages).map((story) => story.storyId);

    expect(firstPageRailIds).toEqual(Array.from({ length: 17 }, (_, index) => `rail-${index + 1}`));
    expect(secondPageRailIds).toEqual(firstPageRailIds);
  });
});

function repositoryWith(listStories: SorimaruRepository['listStories']): SorimaruRepository {
  return { listStories, getStoryDetail: vi.fn(), listRegionGroups: vi.fn(), searchStoriesByKeyword: vi.fn(), listNearbyStories: vi.fn(), getRecommendations: vi.fn() };
}

describe('loadSorimaruInitialData', () => {
  it('uses one first page for archive, hero, and coordinate-free nearby content', async () => {
    const repository = repositoryWith(vi.fn().mockResolvedValue(firstPage));

    const result = await loadSorimaruInitialData(repository);

    expect(repository.listStories).toHaveBeenCalledOnce();
    expect(repository.listStories).toHaveBeenCalledWith({ language: 'ko-KR', limit: 20 });
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
    expect(result.archive).toBe(firstPage);
    expect(result.heroStories).toEqual(stories.slice(0, 7));
    expect(result.nearbyStories).toBe(stories);
    expect(result.archiveError).toBeNull();
  });

  it('keeps the archive failure without inventing nearby content', async () => {
    const failure = new Error('archive unavailable');
    const repository = repositoryWith(vi.fn().mockRejectedValue(failure));

    const result = await loadSorimaruInitialData(repository);

    expect(result.archive).toBeNull();
    expect(result.archiveError).toBe(failure);
    expect(result.heroStories).toEqual([]);
    expect(result.nearbyStories).toEqual([]);
  });
});

describe('loadNextSorimaruPage', () => {
  it('uses only the final cursor and deduplicates overlapping story ids', async () => {
    const secondPage: SorimaruStoryPage = {
      items: [stories[8], { ...stories[0], storyId: 'story-10' }],
      nextCursor: null,
      hasMore: false,
    };
    const repository = repositoryWith(vi.fn().mockResolvedValue(secondPage));
    const pages = [{ items: [stories[0]], nextCursor: 'old-cursor', hasMore: true }, firstPage];

    const result = await loadNextSorimaruPage(repository, pages, { language: 'ko-KR', limit: 12, category: '한옥' });

    expect(repository.listStories).toHaveBeenCalledOnce();
    expect(repository.listStories).toHaveBeenCalledWith({ language: 'ko-KR', limit: 12, category: '한옥', cursor: 'cursor-2' });
    expect(result.at(-1)).toEqual({ items: [{ ...stories[0], storyId: 'story-10' }], nextCursor: null, hasMore: false });
  });

  it.each([
    { pages: [{ items: stories, nextCursor: 'cursor-2', hasMore: false }] },
    { pages: [{ items: stories, nextCursor: null, hasMore: true }] },
  ] satisfies Array<{ pages: SorimaruStoryPage[] }>)('does not request another page without a usable cursor', async ({ pages }) => {
    const repository = repositoryWith(vi.fn());

    const result = await loadNextSorimaruPage(repository, pages, { language: 'ko-KR', limit: 12 });

    expect(result).toBe(pages);
    expect(repository.listStories).not.toHaveBeenCalled();
  });
});

describe('findNearbySorimaruStories', () => {
  it('returns loaded stories within three kilometers, nearest first', () => {
    const result = findNearbySorimaruStories([
      { ...stories[0], coordinates: { lat: 37.51, lng: 127 } },
      { ...stories[1], coordinates: { lat: 37.5, lng: 127 } },
      { ...stories[2], coordinates: { lat: 37.6, lng: 127 } },
      stories[3],
    ], 37.5, 127);

    expect(result.map((story) => story.storyId)).toEqual(['story-1', 'story-0']);
  });
});

describe('resolveSorimaruSelectionIntent', () => {
  it.each([
    [{ stid: 'story-2', title: 'Story 1' }, 'story-2'],
    [{ title: 'Story 3' }, 'story-3'],
    [{ keyword: 'Audio 4' }, 'story-4'],
    [{ track: '6' }, 'story-5'],
  ])('resolves URL selection against loaded summaries', (intent, storyId) => {
    expect(resolveSorimaruSelectionIntent(stories, intent)?.storyId).toBe(storyId);
  });

  it('does not synthesize a selection when the URL has no loaded match', () => {
    expect(resolveSorimaruSelectionIntent(stories, { keyword: 'missing' })).toBeNull();
  });
});
