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
    | '한옥 고택 스테이'
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

