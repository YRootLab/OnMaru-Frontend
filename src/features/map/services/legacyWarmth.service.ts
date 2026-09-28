import { logger } from '@/lib/log';
import { decodeHeatPayload } from '@/features/map/warmth/heatPresentation';
import type { HeatDay, HeatSpot } from '@/features/map/types';

const log = logger('legacyWarmth');

export interface LegacyWarmthResult {
  source: 'TOUR_API_FALLBACK';
  coverageStatus: 'PARTIAL' | 'COMPLETE';
  spots: HeatSpot[];
  days: HeatDay[];
}

export async function fetchLegacyWarmthFallback(params: {
  lat?: number;
  lng?: number;
  level?: number;
  radius?: number;
  signal?: AbortSignal;
}): Promise<LegacyWarmthResult> {
  log.log('Executing Tour API/DataLab fallback via Next.js route /api/map/heat');
  const query = new URLSearchParams();
  if (params.lat !== undefined) query.set('lat', String(params.lat));
  if (params.lng !== undefined) query.set('lng', String(params.lng));
  if (params.level !== undefined) query.set('level', String(params.level));
  if (params.radius !== undefined) query.set('radius', String(params.radius));

  const res = await fetch(`/api/map/heat?${query.toString()}`, { signal: params.signal });
  if (!res.ok) {
    throw new Error(`Legacy warmth fallback HTTP error ${res.status}`);
  }

  const json = await res.json();
  const decoded = decodeHeatPayload(json);
  if (!decoded) {
    throw new Error('Failed to decode legacy warmth fallback payload');
  }

  return {
    source: 'TOUR_API_FALLBACK',
    coverageStatus: decoded.spots.length > 0 ? 'COMPLETE' : 'PARTIAL',
    spots: decoded.spots,
    days: decoded.days,
  };
}
