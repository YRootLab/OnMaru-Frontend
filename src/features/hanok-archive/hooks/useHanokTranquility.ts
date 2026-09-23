// 온기 지수 기능은 공식 스펙에서 제거됨
export interface TranquilityData {
  temp: string;
  tempCelsius: number;
  feelIndex: string;
  district: string;
}

export function useHanokTranquility() {
  return { data: null, loading: false };
}
