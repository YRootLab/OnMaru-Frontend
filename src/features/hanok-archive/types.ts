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
  /*
    라이브 서비스(hanokArchive.service.ts)가 실제로 만들어내는 유형들.
    '도심형'·'집성촌형'·'체험형' 같은 옛 분류는 여기서 지워졌다.
    오타 하나가 필터를 조용히 무력화하는 대신 컴파일 시점에 잡히게 한다.
    이 목록은 src/hanok/lib/classify.mjs의 LIVE_VILLAGE_TYPES와 정확히 같은 
    집합이어야 하고, 어긋나면 classify.contract.test.ts가 잡는다.
  */
  type:
    // 거주 및 생활
    | '고택' | '종택' | '생가' | '민속마을' | '전통마을'
    // 왕실 및 관공서 (경복궁 등 궁궐 포함)
    | '궁궐' | '고궁' | '관아' | '유적지'
    // 교육 및 풍류
    | '서원·향교' | '누정'
    // 근대 및 종교 (기독교 선교사 한옥, 한옥 성당 등)
    | '근대건축' | '종교성지' | '성당·교회'
    // 기타 시설
    | '성곽' | '문'
    // 숙박 전용
    | typeof STAY_TYPE;
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
  /**
   * 유형별로 관광공사가 가진 전체 건수. 수집분(byType)과 다를 수 있다.
   * 화면이 '전수'인지 '수집분'인지 말하려면 이 값이 있어야 한다.
   */
  sourceTotals?: Record<string, number>;
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
  checkin?: string | null;
  checkout?: string | null;
  roomtype?: string | null;
  roomcount?: string | null;
  subfacility?: string | null;
  barbecue?: string | null;
  chkcooking?: string | null;
  refundregulation?: string | null;
  repeatInfo?: RepeatInfoItem[];
  images?: string[];
  lat?: number | null;
  lng?: number | null;
  addr?: string | null;
  source: 'TourAPI' | 'none';
  item?: any;
}

export type SectionId = 'hero' | 'grid' | 'map' | 'monthly' | 'cta';