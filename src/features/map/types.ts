export type MapMode = 'info' | 'warmth';
export type SheetSnap = 'peek' | 'half' | 'full';


export type PlaceCategory =
  | 'spot'
  | 'experience'
  | 'culture'
  | 'festival'
  | 'stay'
  | 'food'
  | 'cafe'
  | 'market';






export type WarmthFilter = 'all' | 'busy' | 'quiet' | 'today' | 'mine';

export interface LatLng {
  lat: number;
  lng: number;
}


export interface Item {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  addr: string;
  image: string | null;
  tel: string | null;

  dist: number | null;

  isTraditional?: boolean;

  savedByMe?: boolean;
}


export interface WarmthAuthor {
  displayName: string;
  characterId?: string;
  backgroundId?: string;
}

export interface Warmth {
  id: string;
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  text: string;
  mood: '북적' | '한적';
  score?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  createdAt: string;

  mine?: boolean;
  author?: WarmthAuthor;

  visitorCount?: number;
  helpfulCount?: number;
  isHelpful?: boolean;
}


export interface WarmthReview {
  id: string;
  placeId: string;
  placeName: string;
  placeRegion: string;

  placeType: string;
  mood: 1 | 2 | 3 | 4 | 5;

  crowdMood?: '북적' | '한적';
  season: '봄' | '여름' | '가을' | '겨울';
  visitCount?: number;
  goodTags: string[];
  goodText?: string;
  badTags: string[];
  badText?: string;

  createdAt: string;
  helpfulCount: number;
  isHelpful?: boolean;

  mine?: boolean;
  author?: WarmthAuthor;
}


export interface RankedPlace {
  placeId: string;
  placeName: string;
  placeType: string;
  placeRegion: string;
  image: string | null;
  lat?: number;
  lng?: number;
}


export interface PlaceDetailData {
  contentId: string;
  contentTypeId: string;
  title: string;
  overview: string;
  addr1: string;
  addr2?: string;
  tel: string | null;
  images: string[];
  mapx: number;
  mapy: number;
  intro: Record<string, string>;
  homepage: string | null;
  contentTags?: string[];
  error?: string;
}


export interface WarmthCell {
  key: string;
  lat: number;
  lng: number;
  count: number;

  latest: Warmth;

  items: Warmth[];
}




export type CongestionLevel = 'relaxed' | 'moderate' | 'busy' | 'surge';

export interface HeatSpot {
  id: string;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  regionCode?: string;
  visitorCount: number;
  congestionScore: number;
  congestionLevel: CongestionLevel;
  surgeMultiplier: number;
  intensity: number;





  series?: number[];
  updatedAt?: string;
}


export interface HeatDay {
  ymd: string;
  weekday: string;
}






export type KakaoMap = any;

// ── Info map ──────────────────────────────────────────────────────────────────

export type MapInfoCategory =
  | 'hanok'
  | 'spot'
  | 'experience'
  | 'culture'
  | 'festival'
  | 'stay'
  | 'food'
  | 'cafe'
  | 'market'
  | 'all';

export const MAP_INFO_CATEGORY_LABELS: Record<MapInfoCategory, string> = {
  hanok: '한옥',
  spot: '고택',
  experience: '전통 체험',
  culture: '문화유산',
  festival: '축제',
  stay: '한옥 숙소',
  food: '전통 맛집',
  cafe: '전통 카페',
  market: '전통 시장',
  all: '전체',
};

export interface InfoPlaceItem {
  placeId: string;
  name: string;
  category: string;
  displayCategory?: string;
  matchedCategories?: string[];
  appliedCategories?: string[];
  coordinates: { lat: number; lng: number };
  region: { regionCode: string; name: string };
  thumbnailUrl: string | null;
  summary: string;
  savedByMe?: boolean;
}

export interface InfoPlacePage {
  query: { category: string };
  snapshot: { id: string; publishedAt: string };
  totalCount: number;
  items: InfoPlaceItem[];
  nextCursor: string | null;
  appliedCategories: string[];
  coverage: string;
}

export type ViewportRenderMode = 'REGION' | 'DISTRICT' | 'CLUSTER' | 'PLACE';

export interface ViewportItemBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ViewportItem {
  type: ViewportRenderMode;
  // PLACE fields
  placeId?: string;
  thumbnailUrl?: string | null;
  // CLUSTER / DISTRICT / REGION fields
  regionCode?: string;
  count?: number;
  categoryCounts?: Record<string, number>;
  // shared
  name: string;
  category?: string;
  center: { lat: number; lng: number };
  bounds?: ViewportItemBounds;
  targetZoomLevel?: number;
}

export interface MapViewportResponse {
  renderMode: ViewportRenderMode;
  servedBbox: ViewportItemBounds;
  snapshotId: string | null;
  items: ViewportItem[];
  totalCountInViewport?: number;
}

export interface ViewportRequestParams {
  bbox: string;
  zoomLevel: number;
  category: string;
  regionCode?: string;
}
