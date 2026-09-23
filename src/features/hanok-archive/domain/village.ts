export const STAY_TYPE = '한옥스테이';

export type VillageType = string;

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
  overview?: string | null;
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
