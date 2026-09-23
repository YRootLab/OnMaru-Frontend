







export type VillageType = '고태' | '고궁' | '사찰' | '펜션' | '게스트하우스' | '펜션형숙박시설' | '문화유산' | string;
export const STAY_TYPE: VillageType = 'stay';

export interface Village {
  id: string;
  name: string;
  rawTitle?: string;
  region: string;
  addr: string;
  lat: number | null;
  lng: number | null;
  type: VillageType;
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
  sourceTotals?: Record<string, number>;
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