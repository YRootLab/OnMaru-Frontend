import type { SorimaruStorySummary } from '../domain/sorimaruStory';
import { SORIMARU_THEME_CATEGORIES } from '../data/sorimaruCategoryData';

const GENERIC_CATEGORIES = new Set(['전체', '오디 이야기', '소리 이야기']);

export interface SorimaruEditorialRailCardViewModel {
  badgeText: string;
  subtitle: string;
  durationText: string;
}

export function editorialRailCardViewModel(story: SorimaruStorySummary): SorimaruEditorialRailCardViewModel {
  const category = story.category.trim();
  const location = story.region.name.trim() || '대한민국 문화유산';
  const tagBadge = story.contentTags
    .map((tag) => tag.trim())
    .map((tag) => /[가-힣]/.test(tag)
      ? tag
      : SORIMARU_THEME_CATEGORIES.find((theme) => theme.id === tag.toLowerCase())?.label)
    .find(Boolean);
  const badgeText = category && !GENERIC_CATEGORIES.has(category)
    ? category
    : tagBadge || location;
  const durationSeconds = Math.max(0, Math.floor(story.durationSeconds));

  return {
    badgeText,
    subtitle: location,
    durationText: `${Math.floor(durationSeconds / 60)}분 ${String(durationSeconds % 60).padStart(2, '0')}초`,
  };
}
