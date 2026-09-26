export type StampRarity = 'common' | 'regional' | 'rare' | 'legendary';
export type ApiStampRarity = 'COMMON' | 'REGIONAL' | 'RARE' | 'LEGENDARY';

export type RegionCode =
  | 'all'
  | 'seoul'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungcheong'
  | 'jeolla'
  | 'gyeongsang'
  | 'jeju';

export type StampConditionType = 'REGION_VISIT' | 'NIGHT_VISIT' | 'REGION_COUNT';

export interface StampSummary {
  collectedCount: number;
  totalCount: number;
  visitedRegionCount: number;
  requiredRegionCount: number;
  completionRate: number;
}

export interface StampDefinition {
  code: string;
  name: string;
  description: string;
  conditionLabel: string;
  sealText: string;
  iconName: string;
  color: string;
  rarity: ApiStampRarity;
  conditionType: StampConditionType;
  requiredCount: number | null;
  regionGroup: string | null;
  sortOrder: number;
}

export interface StampBookItem {
  code: string;
  name: string;
  rarity: ApiStampRarity;
  regionGroup: string | null;
  conditionLabel: string;
  description: string;
  sealText: string;
  iconName: string;
  color: string;
  sortOrder: number;
  collected: boolean;
  collectedAt: string | null;
  triggerPlaceId: string | null;
}

export interface StampCatalogResponse {
  schemaVersion: '1.3';
  stamps: StampDefinition[];
}

export interface StampBookResponse {
  schemaVersion: '1.3';
  summary: StampSummary;
  stamps: StampBookItem[];
}

export interface CheckInResponse {
  schemaVersion: '1.3';
  checkIn: {
    id: string;
    placeId: string;
    checkedInAt: string;
    distanceMeters: number;
    alreadyCheckedIn: boolean;
  };
  newAwards: Array<{
    code: string;
    name: string;
    sealText: string;
    rarity: ApiStampRarity;
    collectedAt: string;
  }>;
  summary: StampSummary;
}

export interface StampRankingEntry {
  rank: number;
  publicId: string;
  nickname: string;
  nicknameType: 'GENERATED';
  stampCount: number;
  visitedRegionCount: number;
  completionRate: number;
}

export interface StampLeaderboardResponse {
  schemaVersion: '1.3';
  generatedAt: string;
  entries: StampRankingEntry[];
}

export interface StampRankingStatusResponse {
  schemaVersion: '1.3';
  participating: boolean;
  publicNickname: string | null;
  nicknameType: 'GENERATED' | null;
  rank: number | null;
  participantCount: number;
  stampCount: number;
  visitedRegionCount: number;
  completionRate: number;
}

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

export interface StampView extends StampDef {
  collected: CollectedStamp | null;
}

export interface StampCollectionView {
  summary: StampSummary;
  stamps: StampView[];
}

export interface StampErrorLike {
  status?: number;
  code: string;
  requestId: string | null;
  details?: Record<string, unknown>;
}

export interface ProvinceVisitStat {
  region: RegionCode;
  name: string;
  visitedCount: number;
  totalCount: number;
  isUnlocked: boolean;
}
