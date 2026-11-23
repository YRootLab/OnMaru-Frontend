import type { DiscoveryPlaceSummary, Region } from './types';

export type RegionKey =
  | 'seoul'
  | 'incheon'
  | 'daejeon'
  | 'daegu'
  | 'gwangju'
  | 'busan'
  | 'ulsan'
  | 'sejong'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungbuk'
  | 'chungnam'
  | 'jeonbuk'
  | 'jeonnam'
  | 'gyeongbuk'
  | 'gyeongnam'
  | 'jeju';

const REGION_CODE_TO_KEY: Record<string, RegionKey> = {
  '1': 'seoul',
  '11': 'seoul',
  '2': 'incheon',
  '28': 'incheon',
  '3': 'daejeon',
  '30': 'daejeon',
  '4': 'daegu',
  '27': 'daegu',
  '5': 'gwangju',
  '29': 'gwangju',
  '6': 'busan',
  '26': 'busan',
  '7': 'ulsan',
  '31': 'gyeonggi',
  '41': 'gyeonggi',
  '8': 'sejong',
  '36': 'jeonnam',
  '46': 'jeonnam',
  '32': 'gangwon',
  '42': 'gangwon',
  '51': 'gangwon',
  '33': 'chungbuk',
  '43': 'chungbuk',
  '34': 'chungnam',
  '44': 'chungnam',
  '35': 'jeonbuk',
  '45': 'jeonbuk',
  '52': 'jeonbuk',
  '37': 'gyeongbuk',
  '47': 'gyeongbuk',
  '38': 'gyeongnam',
  '48': 'gyeongnam',
  '39': 'jeju',
  '50': 'jeju',
};

const REGION_NAME_TO_KEY: Record<string, RegionKey> = {
  서울: 'seoul',
  인천: 'incheon',
  대전: 'daejeon',
  대구: 'daegu',
  광주: 'gwangju',
  부산: 'busan',
  울산: 'ulsan',
  세종: 'sejong',
  경기: 'gyeonggi',
  강원: 'gangwon',
  충북: 'chungbuk',
  충청북: 'chungbuk',
  충남: 'chungnam',
  충청남: 'chungnam',
  전북: 'jeonbuk',
  전라북: 'jeonbuk',
  전남: 'jeonnam',
  전라남: 'jeonnam',
  경북: 'gyeongbuk',
  경상북: 'gyeongbuk',
  경남: 'gyeongnam',
  경상남: 'gyeongnam',
  제주: 'jeju',
};

export function stripKoreanRegionSuffix(rawName: string): string {
  return rawName
    .trim()
    .replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)$/, '')
    .trim();
}

export function resolveRegionKey(region?: Region | null): RegionKey | null {
  if (!region) return null;
  if (region.code && REGION_CODE_TO_KEY[region.code]) {
    return REGION_CODE_TO_KEY[region.code];
  }
  const stripped = region.nameKo ? stripKoreanRegionSuffix(region.nameKo) : '';
  if (stripped && REGION_NAME_TO_KEY[stripped]) {
    return REGION_NAME_TO_KEY[stripped];
  }
  return null;
}

export function getRegionFallbackLabel(region?: Region | null): string | null {
  if (!region) return null;
  const raw = region.nameKo?.trim();
  if (!raw) return null;
  return stripKoreanRegionSuffix(raw) || raw;
}

function hasPlaceImage(place: DiscoveryPlaceSummary): boolean {
  if (!place.placeImage) return false;
  if (typeof place.placeImage === 'string') return place.placeImage.trim().length > 0;
  return Boolean(place.placeImage.url?.trim());
}

function featuredPriority(place: DiscoveryPlaceSummary): number {
  const hasImg = hasPlaceImage(place);
  const hasRel = Boolean(place.featuredRelation);
  if (hasImg && hasRel) return 3;
  if (hasRel) return 2;
  if (hasImg) return 1;
  return 0;
}

export interface FeaturedPartition {
  featured: DiscoveryPlaceSummary[];
  rest: DiscoveryPlaceSummary[];
}

export function selectFeaturedPlaces(
  items: DiscoveryPlaceSummary[],
  maxCount = 5,
): FeaturedPartition {
  if (items.length === 0) {
    return { featured: [], rest: [] };
  }

  const targetCount =
    items.length <= 2
      ? 1
      : items.length < 7
        ? Math.min(3, items.length - 1, maxCount)
        : Math.min(maxCount, items.length);

  const ranked = items
    .map((item, idx) => ({ item, idx, score: featuredPriority(item) }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx));

  const featured = ranked.slice(0, targetCount).map((entry) => entry.item);
  const featuredIds = new Set(featured.map((item) => item.placeId));
  const nonFeatured = items.filter((item) => !featuredIds.has(item.placeId));

  // If the remaining pool is too small to populate horizontal sections, keep all non-primary items.
  const rest =
    nonFeatured.length >= 4 || items.length <= 2
      ? nonFeatured
      : items.filter((item) => item.placeId !== featured[0]?.placeId);

  return { featured, rest };
}

export interface LocalizedTitlePair {
  primary: string;
  secondary: string | null;
}

export function getLocalizedWorkTitle(
  work: { canonicalTitle: string; englishTitle?: string | null },
  locale: string,
): LocalizedTitlePair {
  const canonical = work.canonicalTitle.trim();
  const english = work.englishTitle?.trim() ?? '';

  if (locale !== 'ko' && english && english.toLowerCase() !== canonical.toLowerCase()) {
    return { primary: english, secondary: canonical };
  }

  return { primary: canonical, secondary: null };
}
