import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type RegionLevel = 'PROVINCE' | 'CITY';

export interface RegionCandidate {
  region: {
    regionCode: string;
    parentRegionCode: string | null;
    name: string;
    level: RegionLevel;
  };
  confidence: number;
}

/** GET /api/v1/regions/resolve 응답. 실서버 호출로 검증한 실제 shape (2026-09-19). */
export interface RegionResolveResult {
  schemaVersion: string;
  coordinates: { lat: number; lng: number };
  candidates: RegionCandidate[];
  resolvedAt: string;
}

export interface RegionResolveRepository {
  resolve(lat: number, lng: number): Promise<RegionResolveResult>;
}

export function createRegionResolveRepository(request: RequestFn = apiRequest): RegionResolveRepository {
  return {
    resolve(lat, lng) {
      return request<RegionResolveResult>('/regions/resolve', {
        method: 'GET',
        params: { lat, lng },
      });
    },
  };
}

export const defaultRegionResolveRepository = createRegionResolveRepository();
