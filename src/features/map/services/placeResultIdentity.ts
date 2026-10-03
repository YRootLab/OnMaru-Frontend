import type { Item } from '@/features/map/types';

function areItemsEqual(current: Item, next: Item): boolean {
  return (
    current.id === next.id &&
    current.name === next.name &&
    current.category === next.category &&
    current.lat === next.lat &&
    current.lng === next.lng &&
    current.addr === next.addr &&
    current.image === next.image &&
    current.tel === next.tel &&
    current.dist === next.dist &&
    current.isTraditional === next.isTraditional &&
    current.savedByMe === next.savedByMe
  );
}

export function arePlaceResultsEqual(current: Item[], next: Item[]): boolean {
  return (
    current.length === next.length &&
    current.every((item, index) => areItemsEqual(item, next[index]))
  );
}
