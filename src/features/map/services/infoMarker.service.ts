import type { Item, PlaceCategory, ViewportItem, ViewportRenderMode } from '../types';

export function mapInfoCategoryToPlaceCategory(category?: string): PlaceCategory {
  const normalized = category?.toUpperCase() ?? '';
  if (normalized.includes('STAY')) return 'stay';
  if (normalized.includes('CAFE')) return 'cafe';
  if (normalized.includes('EXPERIENCE')) return 'experience';
  if (normalized.includes('FOOD')) return 'food';
  if (normalized.includes('MARKET')) return 'market';
  if (normalized.includes('FESTIVAL')) return 'festival';
  if (normalized.includes('CULTURE') || normalized.includes('HISTORIC')) return 'culture';
  return 'spot';
}

export function selectInfoMarkerItems(
  renderMode: ViewportRenderMode | null,
  viewportItems: ViewportItem[],
): Item[] {
  if (renderMode !== 'PLACE') return [];

  return viewportItems.flatMap((item) => {
    if (item.type !== 'PLACE' || !item.placeId) return [];
    return [{
      id: item.placeId,
      name: item.name,
      category: mapInfoCategoryToPlaceCategory(item.category),
      lat: item.center.lat,
      lng: item.center.lng,
      addr: '',
      image: item.thumbnailUrl ?? null,
      tel: null,
      dist: null,
      isTraditional: item.category?.toUpperCase().startsWith('HANOK') ?? false,
    }];
  });
}
