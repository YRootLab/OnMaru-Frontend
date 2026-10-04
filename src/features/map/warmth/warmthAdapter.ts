import type { CongestionLevel, HeatDay, HeatSpot } from '@/features/map/types';
import { intensityOf, levelOf } from './congestion';

export interface SpringRegion {
  regionCode: string;
  name: string;
  level: string;
}

export interface SpringCoordinates {
  lat: number;
  lng: number;
}

export function normalizeCongestionLevel(level: string | undefined, score: number): CongestionLevel {
  if (!level) return levelOf(score);
  const l = level.toLowerCase();
  if (l === 'relaxed' || l === 'low') return 'relaxed';
  if (l === 'moderate' || l === 'medium') return 'moderate';
  if (l === 'busy' || l === 'high') return 'busy';
  if (l === 'surge' || l === 'very_high') return 'surge';
  return levelOf(score);
}

export interface SpringHeatmapSpot {
  id: string;
  placeId: string;
  name: string;
  region: SpringRegion;
  coordinates: SpringCoordinates;
  visitorCount?: number;
  congestionScore?: number;
  congestionLevel?: CongestionLevel | string;
  surgeMultiplier?: number;
}

export function isScoreMetric(metric?: string, unit?: string): boolean {
  if (unit) {
    const u = unit.toUpperCase();
    if (u === 'SCORE' || u === 'INDEX' || u === 'POINTS') return true;
    if (u === 'PERSONS' || u === 'PEOPLE' || u === 'COUNT') return false;
  }
  if (metric) {
    const m = metric.toUpperCase();
    if (m.includes('SCORE') || m.includes('CONGESTION')) return true;
    if (m.includes('VISITOR') || m.includes('VISIT') || m.includes('COUNT')) return false;
  }
  return false;
}

export function adaptSpringSpotToHeatSpot(spot: SpringHeatmapSpot): HeatSpot {
  const visitorCount = spot.visitorCount ?? 0;
  const congestionScore = spot.congestionScore ?? 0;
  const congestionLevel = normalizeCongestionLevel(spot.congestionLevel as string, congestionScore);
  const surgeMultiplier = spot.surgeMultiplier ?? 1;

  return {
    id: spot.id,
    placeId: spot.placeId,
    name: spot.name,
    lat: spot.coordinates?.lat ?? 0,
    lng: spot.coordinates?.lng ?? 0,
    district: spot.region?.name ?? '',
    regionCode: spot.region?.regionCode ?? '',
    visitorCount,
    congestionScore,
    congestionLevel,
    surgeMultiplier,
    intensity: intensityOf(congestionScore),
    updatedAt: new Date().toISOString(),
  };
}

export function adaptSpringSpotsToHeatSpots(spots: SpringHeatmapSpot[]): HeatSpot[] {
  if (!Array.isArray(spots)) return [];
  return spots.map(adaptSpringSpotToHeatSpot);
}

export interface ObservationItem {
  observationId: string;
  region: { regionCode: string; name: string; level: string; parentRegionCode: string | null };
  observedDate: string;
  metric: string;
  value: number;
  unit: string;
  spatialLevel: string;
  coverageStatus: string;
}

export function adaptObservationsToDaysAndSeries(
  items: ObservationItem[],
  spots: HeatSpot[],
): { days: HeatDay[]; spots: HeatSpot[] } {
  if (!items || items.length === 0) return { days: [], spots };

  const dateMap = new Map<string, HeatDay>();
  items.forEach((item) => {
    if (!item.observedDate) return;
    const ymd = item.observedDate.replace(/-/g, '');
    if (!dateMap.has(ymd)) {
      const dateObj = new Date(item.observedDate);
      const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = daysOfWeek[dateObj.getDay()] || '';
      dateMap.set(ymd, { ymd, weekday });
    }
  });

  const sortedYmds = Array.from(dateMap.keys()).sort();
  const days: HeatDay[] = sortedYmds.map((ymd) => dateMap.get(ymd)!);

  if (days.length === 0) return { days: [], spots };

  // Only map to congestion series if observations are valid score metrics (0~100 score).
  // Visitor count / persons observations must never be used as congestion scores.
  const isScore = items.some((item) => isScoreMetric(item.metric, item.unit));

  if (!isScore) {
    return { days, spots };
  }

  const regionSeriesMap = new Map<string, Map<string, number>>();
  items.forEach((item) => {
    const ymd = item.observedDate.replace(/-/g, '');
    const rCodes = [item.region?.regionCode, item.region?.name].filter(Boolean) as string[];
    rCodes.forEach((code) => {
      let rMap = regionSeriesMap.get(code);
      if (!rMap) {
        rMap = new Map<string, number>();
        regionSeriesMap.set(code, rMap);
      }
      rMap.set(ymd, item.value);
    });
  });

  const updatedSpots = spots.map((spot) => {
    const rMap =
      (spot.regionCode ? regionSeriesMap.get(spot.regionCode) : undefined) ||
      (spot.district ? regionSeriesMap.get(spot.district) : undefined);

    if (!rMap) {
      // Retain the spot's own congestion score and color for other regions (no cross-region leakage)
      return spot;
    }

    const series = sortedYmds.map((ymd) => {
      const val = rMap.get(ymd);
      return val !== undefined ? val : spot.congestionScore;
    });

    return {
      ...spot,
      series,
    };
  });

  return { days, spots: updatedSpots };
}
