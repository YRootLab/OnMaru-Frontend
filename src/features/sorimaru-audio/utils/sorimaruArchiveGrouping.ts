import type { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';

export interface SorimaruPlaceGroup {
  key: string;
  label: string;
  representative: SorimaruStoryItem;
  stories: SorimaruStoryItem[];
}

const PLACE_SEPARATOR = /\s*[-–—:]\s*/;

function placeLabelFor(story: SorimaruStoryItem): string | null {
  const [candidate, remainder] = story.title.split(PLACE_SEPARATOR, 2);
  if (!candidate || !remainder || candidate.trim().length < 2) return null;
  return candidate.trim();
}

function normalizePlaceKey(label: string): string {
  return label.toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
}

export function groupSorimaruStoriesByPlace(stories: SorimaruStoryItem[]): SorimaruPlaceGroup[] {
  const groups = new Map<string, SorimaruPlaceGroup>();

  stories.forEach((story) => {
    const label = placeLabelFor(story);
    const key = label ? `place:${normalizePlaceKey(label)}` : `stid:${story.stid}`;
    const existing = groups.get(key);

    if (existing) {
      existing.stories.push(story);
      return;
    }

    groups.set(key, {
      key,
      label: label || story.title,
      representative: story,
      stories: [story],
    });
  });

  return Array.from(groups.values());
}
