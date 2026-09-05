const ITEM_HEIGHT = 90;
const OVERSCAN = 4;

export interface VirtualRange {
  startIndex: number;
  endIndex: number;
}

export function getVirtualRange(scrollTop: number, containerHeight: number, totalCount: number): VirtualRange {
  return {
    startIndex: Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN),
    endIndex: Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN),
  };
}
