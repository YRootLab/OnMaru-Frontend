import { apiGet } from '@/lib/api/client';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruListQuery } from '../domain/sorimaruStory';
import { mapRegionGroups, mapStoryDetail, mapStoryPage } from '../domain/sorimaruStoryMapper';
import { createSorimaruQueryCache, sorimaruQueryKeys } from './sorimaruQueryCache';

export type SorimaruBackendRequester = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => Promise<unknown>;

const defaultRequester: SorimaruBackendRequester = (path, params) => apiGet<unknown>(path, params);

export function createSorimaruHttpRepository(request: SorimaruBackendRequester = defaultRequester): SorimaruRepository {
  const cache = createSorimaruQueryCache();

  return {
    listStories(query: SorimaruListQuery, options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.list(query), async () => mapStoryPage(await request('odii/stories', {
        language: query.language,
        limit: query.limit,
        category: query.category,
        regionCode: query.regionCode,
        cursor: query.cursor,
      })), options);
    },

    getStoryDetail(storyId: string, language = 'ko-KR', options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.detail(storyId, language), async () =>
        mapStoryDetail(await request(`odii/stories/${encodeURIComponent(storyId)}`, { language })), options);
    },

    listRegionGroups(language = 'ko-KR', options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.regions(language), async () =>
        mapRegionGroups(await request('odii/regions', { language })), options);
    },
  };
}

export function createSorimaruRuntimeRepository(
  request: SorimaruBackendRequester = defaultRequester,
  isBrowser: () => boolean = () => typeof window !== 'undefined',
): SorimaruRepository {
  const browserRepository = createSorimaruHttpRepository(request);
  const current = () => isBrowser() ? browserRepository : createSorimaruHttpRepository(request);

  return {
    listStories: (query, options) => current().listStories(query, options),
    getStoryDetail: (storyId, language, options) => current().getStoryDetail(storyId, language, options),
    listRegionGroups: (language, options) => current().listRegionGroups(language, options),
  };
}

export const sorimaruRepository = createSorimaruRuntimeRepository();
