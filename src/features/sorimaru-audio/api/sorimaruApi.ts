import type { SorimaruRepository } from '../application/SorimaruRepository';
import { sorimaruRepository } from '../infrastructure/sorimaruHttpRepository';

export function createSorimaruApiAdapter(repository: SorimaruRepository = sorimaruRepository): SorimaruRepository {
  return {
    listStories: (query, options) => repository.listStories(query, options),
    getStoryDetail: (storyId, language, options) => repository.getStoryDetail(storyId, language, options),
    listRegionGroups: (language, options) => repository.listRegionGroups(language, options),
  };
}

export const sorimaruApiAdapter = createSorimaruApiAdapter();
