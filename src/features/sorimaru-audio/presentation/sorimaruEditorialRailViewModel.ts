import type { SorimaruStorySummary } from '../domain/sorimaruStory';

export interface SorimaruEditorialRailCardViewModel {
  badgeText: string;
  subtitle: string;
  durationText: string;
}

export function editorialRailCardViewModel(story: SorimaruStorySummary): SorimaruEditorialRailCardViewModel {
  const category = story.category.trim();
  const location = story.region.name.trim() || '대한민국 문화유산';
  const durationSeconds = Math.max(0, Math.floor(story.durationSeconds));

  return {
    badgeText: category || location,
    subtitle: location,
    durationText: `${Math.floor(durationSeconds / 60)}분 ${String(durationSeconds % 60).padStart(2, '0')}초`,
  };
}
