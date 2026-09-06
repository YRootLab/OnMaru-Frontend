import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

export interface OdiiPlaceGroup {
  key: string;
  label: string;
  representative: OdiiStoryItem;
  stories: OdiiStoryItem[];
}

const PLACE_SEPARATOR = /\s*[-–—:]\s*/;

function placeLabelFor(story: OdiiStoryItem): string | null {
  const [candidate, remainder] = story.title.split(PLACE_SEPARATOR, 2);
  if (!candidate || !remainder || candidate.trim().length < 2) return null;
  return candidate.trim();
}

function normalizePlaceKey(label: string): string {
  return label.toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
}

export function groupOdiiStoriesByPlace(stories: OdiiStoryItem[]): OdiiPlaceGroup[] {
  const groups = new Map<string, OdiiPlaceGroup>();

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
