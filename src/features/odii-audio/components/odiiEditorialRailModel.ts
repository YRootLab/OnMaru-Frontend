export const ODII_RAIL_VISIBLE_BUFFER = 2;

export function getVisibleRailPositions(activePosition: number): number[] {
  return Array.from(
    { length: ODII_RAIL_VISIBLE_BUFFER * 2 + 1 },
    (_, index) => activePosition - ODII_RAIL_VISIBLE_BUFFER + index,
  );
}

export function shouldFetchRailCategory({
  isRailNearby,
  isSelected,
  isInteracted,
}: {
  isRailNearby: boolean;
  isSelected: boolean;
  isInteracted: boolean;
}): boolean {
  return isInteracted || (isRailNearby && isSelected);
}
