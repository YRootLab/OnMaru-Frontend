import type { HeatDay, HeatSpot } from '@/features/map/types';
import { intensityOf, levelOf } from './congestion';

export function selectHeatSpotsForDay(heatSpots: HeatSpot[], heatDayIndex: number): HeatSpot[] {
  return heatSpots.map((spot) => {
    const score = spot.series?.[heatDayIndex];
    if (score === undefined) return spot;

    return {
      ...spot,
      congestionScore: score,
      congestionLevel: levelOf(score),
      intensity: intensityOf(score),
    };
  });
}

export function decodeHeatPayload(payload: unknown): { spots: HeatSpot[]; days: HeatDay[] } | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as { spots?: unknown; days?: unknown };
  if (!Array.isArray(value.spots)) return null;
  return {
    spots: value.spots as HeatSpot[],
    days: Array.isArray(value.days) ? value.days as HeatDay[] : [],
  };
}

export function selectTopHeatSpot(heatSpots: HeatSpot[]): HeatSpot | null {
  return heatSpots.reduce<HeatSpot | null>(
    (top, spot) => !top || spot.visitorCount > top.visitorCount ? spot : top,
    null,
  );
}
