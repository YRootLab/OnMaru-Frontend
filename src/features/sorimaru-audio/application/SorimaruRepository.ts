import type {
  SorimaruListQuery,
  SorimaruRegionGroups,
  SorimaruStoryDetail,
  SorimaruStoryPage,
} from '../domain/sorimaruStory';

export interface SorimaruRepository {
  listStories(query: SorimaruListQuery, options?: { force?: boolean }): Promise<SorimaruStoryPage>;
  getStoryDetail(storyId: string, language?: string, options?: { force?: boolean }): Promise<SorimaruStoryDetail>;
  listRegionGroups(language?: string, options?: { force?: boolean }): Promise<SorimaruRegionGroups>;
}
