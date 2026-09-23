// 온기 지수 기능은 공식 스펙에서 제거됨
export interface TranquilityData {
  temp: string;
  tempCelsius: number;
  feelIndex: string;
  district: string;
  score?: number;
  badgeColor?: string;
  level?: string;
  goldenHour?: string;
  advice?: string;
}

export function useHanokTranquility(_lat?: number | null, _lng?: number | null, _addr?: string | null) {
  return { data: null, loading: false };
}
