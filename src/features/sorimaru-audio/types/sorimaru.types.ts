
export interface TourWaypoint {
  id: string;
  timeSec: number;
  title: string;
  lat: number;
  lng: number;
  zoomLevel?: number;
  photoTip?: string;
  description?: string;
}


export interface SorimaruStoryItem {
  tid: string;
  tlid: string;
  stid: string;
  stlid: string;
  title: string;
  audioTitle: string;
  speaker?: string;
  category: SorimaruCategory;
  distance?: string;
  mapX: string;
  mapY: string;
  script: string;
  parsedScript?: ScriptLine[];
  playTime: string;
  formattedDuration?: string;
  audioUrl: string;
  imageUrl: string;
  badgeText?: string;
  tags?: string[];
  locationName?: string;
  likesCount?: number;
  waypoints?: TourWaypoint[];
}


export interface SorimaruStoryPage {
  items: SorimaruStoryItem[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  source: 'api' | 'mock';
}


export interface ScriptLine {
  id: number;
  timeSec: number;
  text: string;
}


export type SorimaruCategory =
  | '전체'
  | '한옥/고택'
  | '서원/향교'
  | '전통시장/장터'
  | '마을/골목길'
  | '궁궐/역사'
  | '사찰/산사'
  | '소리/문화'
  | '박물관/미술관'
  | '자연/둘레길'
  | string;


export type SorimaruRegion =
  | '경주'
  | '전주'
  | '안동'
  | '서울'
  | '제주'
  | '부산'
  | '대구';


export interface ISorimaruApiService {
  getStoryList(category?: SorimaruCategory | string, query?: string): Promise<SorimaruStoryItem[]>;
  getNearbyStories(mapX?: string | number, mapY?: string | number, radius?: number): Promise<SorimaruStoryItem[]>;
  getStoryPage(
    category?: SorimaruCategory | string,
    query?: string,
    pageNo?: number,
    numOfRows?: number
  ): Promise<SorimaruStoryPage>;
}
