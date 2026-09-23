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





// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KakaoMap = any;
