/**
 * 숙박 가능한 한옥의 type 값.
 *
 * 예전엔 서비스가 '한옥스테이', 타입 선언이 '한옥 고택 스테이', 아코디언 필터가
 * '고택 스테이'로 제각각이었다. 필터는 완전일치라 어느 것도 맞지 않아
 * API로 받아온 100곳이 통째로 버려지고 폴백 7개만 보였다.
 * 리터럴을 흩뿌리지 말고 반드시 이 상수를 쓸 것.
 */
export const STAY_TYPE = '한옥스테이';

export interface Village {
  id: string;
  name: string;
  rawTitle?: string;
  region: string;
  addr: string;
  lat: number | null;
  lng: number | null;
  type:
    | '도심형'
    | '집성촌형'
    | '체험형'
    | '한옥 공공건축물'
    | '궁궐 한옥'
    | '사대부 고택'
    | '서원·향교'
    | typeof STAY_TYPE
    | string;
  badges: string[];
  image: string | null;
  hasImage: boolean;
  summary: string;
  overview: string;
}

export interface VillageMeta {
  generatedAt: string;
  total: number;
  byType: Record<string, number>;
  imageRate: number;
  badgeStats: Record<string, number>;
  badgeFallbackCount: number;
}

export interface RepeatInfoItem {
  title: string;
  content: string;
}

export interface VillageDetailResponse {
  overview: string | null;
  homepage?: string | null;
  tel?: string | null;
  usetime?: string | null;
  restdate?: string | null;
  parking?: string | null;
  expguide?: string | null;
  repeatInfo?: RepeatInfoItem[];
  images?: string[];
  source: 'TourAPI' | 'none';
  item?: any;
}

export type SectionId = 'hero' | 'grid' | 'map' | 'monthly' | 'cta';

