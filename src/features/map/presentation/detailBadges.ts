/**
 * Category and content labels describe the same place in several backend
 * fields. The detail header reserves chips for context that changes for the
 * current visitor instead.
 */
export function getDetailBadges(travelLabel: string | null | undefined): string[] {
  const label = travelLabel?.trim();
  return label ? [label] : [];
}
