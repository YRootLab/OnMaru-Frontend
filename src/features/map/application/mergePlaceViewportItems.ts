import type { ViewportItem } from '../types';

const MAX_CACHED_PLACES = 500;

export function mergePlaceViewportItems(previous: ViewportItem[], incoming: ViewportItem[]): ViewportItem[] {
  const places = new Map<string, ViewportItem>();
  for (const item of [...previous, ...incoming]) {
    if (item.type !== 'PLACE' || !item.placeId) continue;
    places.set(item.placeId, item);
  }
  while (places.size > MAX_CACHED_PLACES) {
    const oldest = places.keys().next().value;
    if (!oldest) break;
    places.delete(oldest);
  }
  return [...places.values()];
}
