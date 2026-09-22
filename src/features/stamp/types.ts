export type StampRarity = 'common' | 'regional' | 'rare' | 'legendary';

export type RegionCode =
  | 'all'
  | 'seoul'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungcheong'
  | 'jeolla'
  | 'gyeongsang'
  | 'jeju';

export interface StampDef {
  id: string;
  name: string;
  rarity: StampRarity;
  region: RegionCode;
  regionName: string;
  condition: string;
  description: string;
  sealText: string;
  iconName: string;
  color: string;
  requiredCount?: number;
  placeIds?: string[];
}

export interface CollectedStamp {
  stampId: string;
  placeId: string;
  placeName: string;
  collectedAt: string;
  rarity: StampRarity;
  memo?: string;
}

export interface ProvinceVisitStat {
  region: RegionCode;
  name: string;
  visitedCount: number;
  totalCount: number;
  isUnlocked: boolean;
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  nickname: string;
  title: string;
  stampCount: number;
  provincesCount: number;
  isCurrentUser?: boolean;
}
