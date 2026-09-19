import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  FE #92: GET /insights/heatmap, GET /insights/observations.

  이 파일은 두 엔드포인트를 호출 가능한 상태로 "연동"만 한다 — 기존
  visitor.service.ts(getDailySeries/getDetailedData/scoreOf/resolveCongestion)를
  이 shape으로 교체하지는 않았다. 실서버로 오늘 날짜를 넣어 직접 확인한 결과
  `coverageStatus: "MISSING", spots: []`로 아직 실시간 히트맵 데이터가 비어 있다
  (2026-09-19). 지금 교체하면 이미 잘 나오던 혼잡도 지도가 완전히 빈 화면이 된다 —
  백엔드가 실제 관측치를 채운 뒤에 visitor.service.ts 소비부를 이 repository로
  옮기는 별도 작업으로 진행할 것.
*/

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
