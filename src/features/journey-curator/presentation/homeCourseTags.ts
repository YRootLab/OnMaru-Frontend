export const COURSE_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  HANOK: '한옥',
  HANOK_EXPERIENCE: '한옥 체험',
  HANOK_CAFE: '한옥 카페',
  HANOK_STAY: '한옥 숙박',
  CULTURE_ART: '문화 예술',
  TRADITIONAL_FOOD: '전통 음식',
  GARDEN_ECOLOGY: '정원 생태',
  LOCAL_SCENE: '지역 생활',
};

export type HomeCourseTag = {
  label: string;
  kind: 'category' | 'content' | 'saved';
};

const normalizeTag = (value: string) => value.trim().replace(/^#+/, '').trim().replace(/\s+/g, ' ');
const comparisonKey = (value: string) => normalizeTag(value).toLocaleLowerCase('ko-KR');

export function getHomeCourseCategoryLabel(category?: string | null): string {
  const normalized = category?.trim();
  if (!normalized) return '추천 장소';

  const mapped = COURSE_CATEGORY_LABELS[normalized.toUpperCase()];
  if (mapped) return mapped;

  return /[가-힣]/.test(normalized) ? normalized : '추천 장소';
}

export function buildHomeCourseTags(input: {
  category?: string | null;
  tags?: string[] | null;
  savedByMe?: boolean;
}): HomeCourseTag[] {
  const category = getHomeCourseCategoryLabel(input.category);
  const seen = new Set([comparisonKey(category)]);
  const contentLimit = input.savedByMe ? 1 : 2;
  const content = (input.tags ?? []).flatMap((raw) => {
    const label = normalizeTag(raw);
    const key = comparisonKey(label);

    if (!label || seen.has(key)) return [];

    seen.add(key);
    return [{ label, kind: 'content' as const }];
  }).slice(0, contentLimit);

  return [
    { label: category, kind: 'category' },
    ...content,
    ...(input.savedByMe ? [{ label: '저장됨', kind: 'saved' as const }] : []),
  ];
}
