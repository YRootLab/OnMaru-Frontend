import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruRegionGroups } from '../domain/sorimaruStory';
import { sorimaruRepository } from '../infrastructure/sorimaruHttpRepository';

export type SorimaruRegionGroupsResponse = SorimaruRegionGroups;
export type SorimaruNetworkClient = SorimaruRepository;

export function createSorimaruNetworkClient(repository: SorimaruRepository = sorimaruRepository): SorimaruNetworkClient {
  return {
    listStories: (query, options) => repository.listStories(query, options),
    getStoryDetail: (storyId, language, options) => repository.getStoryDetail(storyId, language, options),
    listRegionGroups: (language, options) => repository.listRegionGroups(language, options),
  };
}

export const sorimaruNetworkClient = createSorimaruNetworkClient();

export function fetchSorimaruRegionGroups(
  language = 'ko-KR',
  repository: SorimaruRepository = sorimaruRepository,
): Promise<SorimaruRegionGroupsResponse> {
  return repository.listRegionGroups(language);
}
