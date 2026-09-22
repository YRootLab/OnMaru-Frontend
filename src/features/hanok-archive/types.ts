







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

    | '고택' | '종택' | '생가' | '민속마을' | '전통마을'

    | '궁궐' | '고궁' | '관아' | '유적지'

    | '서원·향교' | '누정'

    | '근대건축' | '종교성지' | '성당·교회'

    | '성곽' | '문'

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

  contentTags?: string[];
  source: 'TourAPI' | 'none' | 'backend';
  item?: any;
}

export type SectionId = 'hero' | 'grid' | 'map' | 'monthly' | 'cta';