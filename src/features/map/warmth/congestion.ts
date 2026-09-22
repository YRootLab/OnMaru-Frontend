import type { CongestionLevel } from '@/features/map/types';









export function levelOf(score: number): CongestionLevel {
  if (score >= 75) return 'surge';
  if (score >= 50) return 'busy';
  if (score >= 30) return 'moderate';
  return 'relaxed';
}


export function intensityOf(score: number): number {
  return Math.min(1, Math.max(0.25, score / 100));
}
