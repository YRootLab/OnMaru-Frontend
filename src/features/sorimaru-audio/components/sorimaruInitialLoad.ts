import type { ISorimaruApiService, SorimaruStoryItem, SorimaruStoryPage } from '../types/sorimaru.types';

export interface SorimaruInitialData {
  archive: SorimaruStoryPage | null;
  heroStories: SorimaruStoryItem[];
  nearbyStories: SorimaruStoryItem[];
  archiveError: Error | null;
  nearbyError: Error | null;
}

export async function loadSorimaruInitialData(service: ISorimaruApiService): Promise<SorimaruInitialData> {
  const [archiveResult, nearbyResult] = await Promise.allSettled([
    service.getStoryPage('전체', '', 1, 12),
    service.getNearbyStories(),
  ]);
  const archive = archiveResult.status === 'fulfilled' ? archiveResult.value : null;

  return {
    archive,
    heroStories: archive?.items.slice(0, 7) ?? [],
    nearbyStories: nearbyResult.status === 'fulfilled' ? nearbyResult.value : [],
    archiveError: archiveResult.status === 'rejected'
      ? (archiveResult.reason instanceof Error ? archiveResult.reason : new Error('Sorimaru archive request failed'))
      : null,
    nearbyError: nearbyResult.status === 'rejected'
      ? (nearbyResult.reason instanceof Error ? nearbyResult.reason : new Error('Sorimaru nearby request failed'))
      : null,
  };
}
