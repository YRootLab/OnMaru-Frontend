import type { SorimaruRepository } from '../application/SorimaruRepository';
import { sorimaruRepository } from '../infrastructure/sorimaruHttpRepository';

export function createSorimaruApiAdapter(repository: SorimaruRepository = sorimaruRepository): SorimaruRepository {
  return {
    listStories: (query, options) => repository.listStories(query, options),
    getStoryDetail: (storyId, language, options) => repository.getStoryDetail(storyId, language, options),
    listRegionGroups: (language, options) => repository.listRegionGroups(language, options),
    searchStoriesByKeyword: (keyword, language, options) => repository.searchStoriesByKeyword(keyword, language, options),
    listNearbyStories: (lat, lng, radius, language, options) => repository.listNearbyStories(lat, lng, radius, language, options),
    getRecommendations: (keyword, language, options) => repository.getRecommendations(keyword, language, options),
  };
}

export const sorimaruApiAdapter = createSorimaruApiAdapter();
