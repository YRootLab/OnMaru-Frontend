import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruListQuery, SorimaruStoryPage, SorimaruStorySummary } from '../domain/sorimaruStory';

export interface SorimaruInitialData {
  archive: SorimaruStoryPage | null;
  heroStories: SorimaruStorySummary[];
  nearbyStories: SorimaruStorySummary[];
  archiveError: Error | null;
}

export async function loadSorimaruInitialData(repository: SorimaruRepository): Promise<SorimaruInitialData> {
  try {
    const archive = await repository.listStories({ language: 'ko-KR', limit: 12 });
    return {
      archive,
      heroStories: archive.items.slice(0, 7),
      nearbyStories: archive.items,
      archiveError: null,
    };
  } catch (reason) {
    return {
      archive: null,
      heroStories: [],
      nearbyStories: [],
      archiveError: reason instanceof Error ? reason : new Error('Sorimaru archive request failed'),
    };
  }
}

export async function loadNextSorimaruPage(
  repository: SorimaruRepository,
  pages: SorimaruStoryPage[],
  query: SorimaruListQuery,
): Promise<SorimaruStoryPage[]> {
  const lastPage = pages.at(-1);
  if (!lastPage?.hasMore || !lastPage.nextCursor) return pages;

  const nextPage = await repository.listStories({ ...query, cursor: lastPage.nextCursor });
  const seen = new Set(pages.flatMap((page) => page.items.map((story) => story.storyId)));
  const items = nextPage.items.filter((story) => {
    if (seen.has(story.storyId)) return false;
    seen.add(story.storyId);
    return true;
  });
  return [...pages, { ...nextPage, items }];
}

export function loadedEditorialRailStories(pages: SorimaruStoryPage[]): SorimaruStorySummary[] {
  const seen = new Set<string>();
  return pages.flatMap((page) => page.items.filter((story) => {
    if (seen.has(story.storyId)) return false;
    seen.add(story.storyId);
    return true;
  }));
}

export function findNearbySorimaruStories(
  stories: SorimaruStorySummary[],
  latitude: number,
  longitude: number,
): SorimaruStorySummary[] {
  const radians = Math.PI / 180;
  return stories
    .flatMap((story) => {
      if (!story.coordinates) return [];
      const latitudeDelta = (story.coordinates.lat - latitude) * radians;
      const longitudeDelta = (story.coordinates.lng - longitude) * radians;
      const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(latitude * radians) * Math.cos(story.coordinates.lat * radians)
        * Math.sin(longitudeDelta / 2) ** 2;
      const distance = 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(haversine)));
      return distance <= 3 ? [{ story, distance }] : [];
    })
    .sort((left, right) => left.distance - right.distance)
    .map(({ story }) => story);
}

export interface SorimaruSelectionIntent {
  stid?: string | null;
  title?: string | null;
  keyword?: string | null;
  track?: string | null;
}

export function resolveSorimaruSelectionIntent(
  stories: SorimaruStorySummary[],
  intent: SorimaruSelectionIntent,
): SorimaruStorySummary | null {
  if (intent.stid) {
    const match = stories.find((story) => story.storyId === intent.stid);
    if (match) return match;
  }
  if (intent.title) {
    const title = intent.title;
    const match = stories.find((story) => story.title.includes(title) || story.audioTitle.includes(title));
    if (match) return match;
  }
  if (intent.keyword) {
    const keyword = intent.keyword;
    const match = stories.find((story) =>
      story.title.includes(keyword) || story.audioTitle.includes(keyword) || story.region.name.includes(keyword),
    );
    if (match) return match;
  }
  if (intent.track) {
    const index = Number.parseInt(intent.track, 10) - 1;
    if (index >= 0 && index < stories.length) return stories[index];
  }
  return null;
}
