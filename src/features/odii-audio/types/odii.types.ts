/** 시네마틱 공간 오디오 투어 경유지 정보 */
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

/** 오디 오디오 이야기 항목 정보 */
export interface OdiiStoryItem {
  tid: string;
  tlid: string;
  stid: string;
  stlid: string;
  title: string;
  audioTitle: string;
  speaker?: string;
  category: OdiiCategory;
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
  locationName?: string;
  likesCount?: number;
  waypoints?: TourWaypoint[];
}

/** 오디 이야기 페이지네이션 결과 정보 */
export interface OdiiStoryPage {
  items: OdiiStoryItem[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  source: 'api' | 'mock';
}

/** 자막 대본 라인 정보 */
export interface ScriptLine {
  id: number;
  timeSec: number;
  text: string;
}

/** 오디 카테고리 분류 */
export type OdiiCategory =
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

/** 주요 권역 분류 */
export type OdiiRegion =
  | '경주'
  | '전주'
  | '안동'
  | '서울'
  | '제주'
  | '부산'
  | '대구';

/** 오디 API 서비스 인터페이스 */
export interface IOdiiApiService {
  getStoryList(category?: OdiiCategory | string, query?: string): Promise<OdiiStoryItem[]>;
  getNearbyStories(mapX?: string | number, mapY?: string | number, radius?: number): Promise<OdiiStoryItem[]>;
  getStoryPage(
    category?: OdiiCategory | string,
    query?: string,
    pageNo?: number,
    numOfRows?: number
  ): Promise<OdiiStoryPage>;
}
