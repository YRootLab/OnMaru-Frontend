import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;













export interface HeatmapSpot {
  [key: string]: unknown;
}

export interface HeatmapResult {
  schemaVersion: string;
  coverageStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  metric: string;
  observedDate: string;
  generatedAt: string;
  spots: HeatmapSpot[];
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

export interface ObservationsResult {
  schemaVersion: string;
  coverageStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  generatedAt: string;
  items: ObservationItem[];
}

export interface MapInsightsRepository {
  getHeatmap(input: { date: string; regionCode?: string; metric?: string }): Promise<HeatmapResult>;
  getObservations(input: { regionCode: string; metric?: string; from?: string; to?: string }): Promise<ObservationsResult>;
}

export function createMapInsightsRepository(request: RequestFn = apiRequest): MapInsightsRepository {
  return {
    getHeatmap(input) {
      return request<HeatmapResult>('/insights/heatmap', { method: 'GET', params: input });
    },
    getObservations(input) {
      return request<ObservationsResult>('/insights/observations', { method: 'GET', params: input });
    },
  };
}

export const defaultMapInsightsRepository = createMapInsightsRepository();
