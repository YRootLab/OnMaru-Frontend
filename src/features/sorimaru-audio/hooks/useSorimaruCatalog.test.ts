import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryPage, SorimaruStorySummary } from '../domain/sorimaruStory';
import { catalogCategoryForSelection, createSorimaruCatalogController } from './useSorimaruCatalog';

const story = (storyId: string): SorimaruStorySummary => ({
  storyId, title: storyId, audioTitle: storyId, category: '한옥',
  region: { regionCode: 'kr-11', name: '서울특별시', level: 'PROVINCE', parentRegionCode: null },
  coordinates: null, durationSeconds: 180, imageUrl: null, linkedPlaceId: null,
  contentTags: [], savedByMe: false,
});
const page = (id: string, nextCursor: string | null = null): SorimaruStoryPage => ({
  items: [story(id)], nextCursor, hasMore: nextCursor !== null,
});
const repository = (listStories: SorimaruRepository['listStories']): SorimaruRepository => ({
  listStories, getStoryDetail: vi.fn(), listRegionGroups: vi.fn(),
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('Sorimaru catalog controller', () => {
  it('does not send a region display name as a category', () => {
    expect(catalogCategoryForSelection('경주')).toBe('전체');
    expect(catalogCategoryForSelection('한옥')).toBe('한옥');
  });

  it('loads the selected category when it changes before the initial page resolves', async () => {
    const initial = deferred<SorimaruStoryPage>();
    const listStories = vi.fn().mockReturnValueOnce(initial.promise).mockResolvedValueOnce(page('filtered'));
    const catalog = createSorimaruCatalogController(repository(listStories));

    const loading = catalog.loadInitial();
    await catalog.setScope('한옥');
    initial.resolve(page('initial'));
    await loading;

    expect(listStories).toHaveBeenCalledTimes(2);
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('filtered');
  });

  it('ignores an old category response after the scope changes', async () => {
    const oldScope = deferred<SorimaruStoryPage>();
    const newScope = deferred<SorimaruStoryPage>();
    const listStories = vi.fn()
      .mockReturnValueOnce(oldScope.promise)
      .mockReturnValueOnce(newScope.promise);
    const catalog = createSorimaruCatalogController(repository(listStories), page('initial'));

    await catalog.loadInitial();
    const first = catalog.setScope('한옥');
    const second = catalog.setScope('시장');
    newScope.resolve(page('market'));
    await second;
    oldScope.resolve(page('hanok'));
    await first;

    expect(listStories).toHaveBeenNthCalledWith(1, { language: 'ko-KR', limit: 12, category: '한옥' });
    expect(listStories).toHaveBeenNthCalledWith(2, { language: 'ko-KR', limit: 12, category: '시장' });
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('market');
    expect(catalog.getSnapshot().catalog.error).toBeNull();
  });

  it('ignores a cursor response after the category changes', async () => {
    const oldCursor = deferred<SorimaruStoryPage>();
    const listStories = vi.fn().mockReturnValueOnce(oldCursor.promise).mockResolvedValueOnce(page('market'));
    const catalog = createSorimaruCatalogController(repository(listStories), page('initial', 'cursor-2'));
    await catalog.loadInitial();

    const cursorLoading = catalog.goToPage(2);
    await catalog.setScope('시장');
    oldCursor.resolve(page('stale'));
    await cursorLoading;

    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('market');
    expect(catalog.getSnapshot().currentPage).toBe(1);
    expect(catalog.getSnapshot().catalog.loadingNext).toBe(false);
  });

  it('clears first-page errors after retry and cached-scope restoration', async () => {
    const failure = new Error('offline');
    const listStories = vi.fn().mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(page('recovered'))
      .mockRejectedValueOnce(new Error('filtered unavailable'));
    const catalog = createSorimaruCatalogController(repository(listStories));

    await catalog.loadInitial();
    expect(catalog.getSnapshot().catalog).toMatchObject({ status: 'error', error: failure });

    await catalog.retry();
    expect(catalog.getSnapshot().catalog).toMatchObject({ status: 'success', error: null });
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('recovered');

    await catalog.setScope('한옥');
    expect(catalog.getSnapshot().catalog.status).toBe('error');
    await catalog.setScope('전체');
    expect(catalog.getSnapshot().catalog).toMatchObject({ status: 'success', error: null });
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('recovered');
  });

  it('keeps the numbered page after a failed cursor request and clears its error on retry', async () => {
    const failure = new Error('cursor failed');
    const listStories = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(page('second'));
    const catalog = createSorimaruCatalogController(repository(listStories), page('first', 'cursor-2'));
    await catalog.loadInitial();

    await catalog.goToPage(2);
    expect(catalog.getSnapshot().catalog.error).toBe(failure);
    expect(catalog.getSnapshot().currentPage).toBe(1);

    await catalog.goToPage(2);
    expect(listStories).toHaveBeenNthCalledWith(2, { language: 'ko-KR', limit: 12, cursor: 'cursor-2' });
    expect(catalog.getSnapshot().currentPage).toBe(2);
    expect(catalog.getSnapshot().catalog.error).toBeNull();
  });
});
