export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export function seasonForMonth(month: number): SeasonId {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export const SEASON_ORDER: readonly SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
