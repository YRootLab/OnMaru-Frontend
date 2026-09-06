import type { IOdiiApiService, OdiiStoryItem, OdiiStoryPage } from '../types/odii.types';

export interface OdiiInitialData {
  archive: OdiiStoryPage | null;
  heroStories: OdiiStoryItem[];
  nearbyStories: OdiiStoryItem[];
  archiveError: Error | null;
  nearbyError: Error | null;
}

export async function loadOdiiInitialData(service: IOdiiApiService): Promise<OdiiInitialData> {
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
      ? (archiveResult.reason instanceof Error ? archiveResult.reason : new Error('Odii archive request failed'))
      : null,
    nearbyError: nearbyResult.status === 'rejected'
      ? (nearbyResult.reason instanceof Error ? nearbyResult.reason : new Error('Odii nearby request failed'))
      : null,
  };
}
