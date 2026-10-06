export const MAP_INFO_CATEGORIES = [
  'hanok',
  'spot',
  'experience',
  'culture',
  'festival',
  'stay',
  'food',
  'cafe',
  'market',
] as const;

export type MapInfoCategory = (typeof MAP_INFO_CATEGORIES)[number];

export function normalizeInfoCategory(value: string | null | undefined): MapInfoCategory {
  return MAP_INFO_CATEGORIES.includes(value as MapInfoCategory)
    ? value as MapInfoCategory
    : 'hanok';
}

interface InfoUrlReconciliationInput {
  inboundNavigationPending: boolean;
  queryMode: string | null;
  queryCategory: string | null;
  queryRegionCode: string | null;
  selectedCategory: MapInfoCategory;
  selectedRegionCode: string | null;
}

export function isInfoUrlReconciliationPending({
  inboundNavigationPending,
  queryMode,
  queryCategory,
  queryRegionCode,
  selectedCategory,
  selectedRegionCode,
}: InfoUrlReconciliationInput): boolean {
  if (!inboundNavigationPending || queryMode !== 'info') return false;
  return normalizeInfoCategory(queryCategory) !== selectedCategory
    || queryRegionCode !== selectedRegionCode;
}
