import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryPage, SorimaruStorySummary } from '../domain/sorimaruStory';
import { SorimaruRegionMappingError, catalogCategoryForSelection, createSorimaruCatalogController } from './useSorimaruCatalog';

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
  searchStoriesByKeyword: vi.fn(), listNearbyStories: vi.fn(), getRecommendations: vi.fn(),
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};

describe('Sorimaru catalog controller', () => {
  it('does not send a region display name as a category', () => {
    expect(catalogCategoryForSelection('경주')).toBe('전체');
    expect(catalogCategoryForSelection('한옥')).toBe('한옥');
  });

  it('resolves an exact backend region label and requests its canonical code', async () => {
    const listStories = vi.fn().mockResolvedValue(page('gyeongju'));
    const listRegionGroups = vi.fn().mockResolvedValue({ groups: [
      { label: '경주', regionCodes: ['kr-47-130'], storyCount: 3 },
    ] });
    const catalog = createSorimaruCatalogController({ ...repository(listStories), listRegionGroups }, page('initial'));
    await catalog.loadInitial();

    await catalog.setRegionSelection('경주');
    await catalog.setScope('전체');
    await catalog.setRegionSelection('경주');

    expect(listRegionGroups).toHaveBeenCalledExactlyOnceWith('ko-KR');
    expect(listStories).toHaveBeenCalledTimes(2);
    expect(listStories).toHaveBeenNthCalledWith(1, { language: 'ko-KR', limit: 20, regionCode: 'kr-47-130' });
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('gyeongju');
  });

  it('shows a mapping error and makes no story request when no exact backend label exists', async () => {
    const listStories = vi.fn();
    const listRegionGroups = vi.fn().mockResolvedValue({ groups: [
      { label: '경상북도', regionCodes: ['kr-47'], storyCount: 4 },
    ] });
    const catalog = createSorimaruCatalogController({ ...repository(listStories), listRegionGroups }, page('initial'));
    await catalog.loadInitial();

    await catalog.setRegionSelection('경주');

    expect(listStories).not.toHaveBeenCalled();
    expect(catalog.getSnapshot().catalog).toMatchObject({
      pages: [], status: 'error', error: expect.any(SorimaruRegionMappingError),
    });
    expect(catalog.getSnapshot().catalog.error).toMatchObject({ reason: 'missing' });
    await catalog.retry();
    expect(listStories).not.toHaveBeenCalled();
  });

  it('shows a mapping error and makes no story request for a multi-code group', async () => {
    const listStories = vi.fn();
    const listRegionGroups = vi.fn().mockResolvedValue({ groups: [
      { label: '경주', regionCodes: ['kr-47-130', 'kr-47-131'], storyCount: 7 },
    ] });
    const catalog = createSorimaruCatalogController({ ...repository(listStories), listRegionGroups }, page('initial'));
    await catalog.loadInitial();

    await catalog.setRegionSelection('경주');

    expect(listStories).not.toHaveBeenCalled();
    expect(catalog.getSnapshot().catalog).toMatchObject({
      pages: [], status: 'error', error: expect.any(SorimaruRegionMappingError),
    });
    expect(catalog.getSnapshot().catalog.error).toMatchObject({ reason: 'multiple-codes' });
    await catalog.retry();
    expect(listStories).not.toHaveBeenCalled();
  });

  it('keeps a failed initial request visible after a filtered page succeeds and retries it', async () => {
    const initialError = new Error('initial offline');
    const listStories = vi.fn()
      .mockRejectedValueOnce(initialError)
      .mockResolvedValueOnce(page('filtered'))
      .mockResolvedValueOnce(page('initial recovered'))
      .mockResolvedValueOnce(page('filtered'));
    const catalog = createSorimaruCatalogController(repository(listStories));

    await catalog.loadInitial();
    await catalog.setScope('한옥');
    expect(catalog.getSnapshot().catalog.status).toBe('success');
    expect(catalog.getSnapshot().initialError).toBe(initialError);

    await catalog.retry();
    expect(catalog.getSnapshot().initialError).toBeNull();
    expect(catalog.getSnapshot().initialData?.heroStories[0].storyId).toBe('initial recovered');
  });

  it('finishes region lookup when the failed initial page is retried concurrently', async () => {
    const groups = deferred<{ groups: Array<{ label: string; regionCodes: string[]; storyCount: number }> }>();
    const listStories = vi.fn()
      .mockRejectedValueOnce(new Error('initial offline'))
      .mockResolvedValueOnce(page('initial recovered'))
      .mockResolvedValueOnce(page('region'));
    const catalog = createSorimaruCatalogController({
      ...repository(listStories), listRegionGroups: vi.fn().mockReturnValue(groups.promise),
    });
    await catalog.loadInitial();

    const regionLoading = catalog.setRegionSelection('경주');
    await catalog.retry();
    groups.resolve({ groups: [{ label: '경주', regionCodes: ['kr-47-130'], storyCount: 1 }] });
    await regionLoading;

    expect(catalog.getSnapshot().initialError).toBeNull();
    expect(catalog.getSnapshot().catalog.pages[0].items[0].storyId).toBe('region');
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

    expect(listStories).toHaveBeenNthCalledWith(1, { language: 'ko-KR', limit: 20, category: '한옥' });
    expect(listStories).toHaveBeenNthCalledWith(2, { language: 'ko-KR', limit: 20, category: '시장' });
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

  it('hides a failed initial request while retrying and restores the error only after retry failure', async () => {
    const retryRequest = deferred<SorimaruStoryPage>();
    const listStories = vi.fn()
      .mockRejectedValueOnce(new Error('initial offline'))
      .mockReturnValueOnce(retryRequest.promise);
    const catalog = createSorimaruCatalogController(repository(listStories));

    await catalog.loadInitial();
    expect(catalog.getSnapshot()).toMatchObject({
      initialLoading: false,
      initialError: expect.any(Error),
      catalog: { status: 'error', error: expect.any(Error) },
    });

    const retrying = catalog.retry();
    expect(catalog.getSnapshot()).toMatchObject({
      initialLoading: true,
      initialError: null,
      catalog: { status: 'loading', error: null },
    });

    retryRequest.reject(new Error('retry timed out'));
    await retrying;
    expect(catalog.getSnapshot()).toMatchObject({
      initialLoading: false,
      initialError: expect.any(Error),
      catalog: { status: 'error', error: expect.any(Error) },
    });
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
    expect(listStories).toHaveBeenNthCalledWith(2, { language: 'ko-KR', limit: 20, cursor: 'cursor-2' });
    expect(catalog.getSnapshot().currentPage).toBe(2);
    expect(catalog.getSnapshot().catalog.error).toBeNull();
  });
});
