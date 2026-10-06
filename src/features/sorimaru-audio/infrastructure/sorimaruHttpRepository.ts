import { apiRequest } from '@/lib/api/client';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruListQuery } from '../domain/sorimaruStory';
import { mapRegionGroups, mapStoryDetail, mapStoryPage } from '../domain/sorimaruStoryMapper';
import { createSorimaruQueryCache, sorimaruQueryKeys } from './sorimaruQueryCache';

export type SorimaruBackendRequester = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => Promise<unknown>;

// Sorimaru is backed by a cold-startable service. Keep a slow request from
// leaving the carousel/detail views in a permanent loading state.
const defaultRequester: SorimaruBackendRequester = (path, params) => apiRequest<unknown>(path, {
  method: 'GET',
  params,
  timeoutMs: 15000,
  retry: { maxRetries: 1 },
});

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

    searchStoriesByKeyword(keyword: string, language = 'ko-KR', options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.keyword(keyword, language), async () =>
        mapStoryPage(await request('/api/stories', { keyword, language })), options);
    },

    listNearbyStories(lat: number, lng: number, radius: number, language = 'ko-KR', options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.nearby(lat, lng, radius, language), async () =>
        mapStoryPage(await request('/api/stories/nearby', { lat, lng, radius, limit: 30, language })), options);
    },

    getRecommendations(keyword: string, language = 'ko-KR', options?: { force?: boolean }) {
      return cache.read(sorimaruQueryKeys.recommendations(keyword, language), async () =>
        mapStoryPage(await request('/api/recommendation', { keyword, language })), options);
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
    searchStoriesByKeyword: (keyword, language, options) => current().searchStoriesByKeyword(keyword, language, options),
    listNearbyStories: (lat, lng, radius, language, options) => current().listNearbyStories(lat, lng, radius, language, options),
    getRecommendations: (keyword, language, options) => current().getRecommendations(keyword, language, options),
  };
}

export const sorimaruRepository = createSorimaruRuntimeRepository();
