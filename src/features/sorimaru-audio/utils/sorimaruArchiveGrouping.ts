import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';

export interface SorimaruPlaceGroup {
  key: string;
  label: string;
  representative: SorimaruStorySummary;
  stories: SorimaruStorySummary[];
}

const PLACE_SEPARATOR = /\s*[-–—:]\s*/;

function placeLabelFor(story: SorimaruStorySummary): string | null {
  const [candidate, remainder] = story.title.split(PLACE_SEPARATOR, 2);
  if (!candidate || !remainder || candidate.trim().length < 2) return null;
  return candidate.trim();
}

function normalizePlaceKey(label: string): string {
  return label.toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
}

export function groupSorimaruStoriesByPlace(stories: SorimaruStorySummary[]): SorimaruPlaceGroup[] {
  const groups = new Map<string, SorimaruPlaceGroup>();

  stories.forEach((story) => {
    const label = placeLabelFor(story);
    const key = label ? `place:${normalizePlaceKey(label)}` : `stid:${story.storyId}`;
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
