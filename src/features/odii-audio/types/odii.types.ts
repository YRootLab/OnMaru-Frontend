export interface TourWaypoint {
  id: string;
  timeSec: number;        // 이 스팟이 시작되는 오디오 시간(초)
  title: string;          // 경유지 이름 (예: "1. 경기전 하마비")
  lat: number;            // 위도
  lng: number;            // 경도
  zoomLevel?: number;     // 줌 레벨 (기본 3)
  photoTip?: string;      // "📸 포토 꿀팁: 대나무 숲 사이로 쏟아지는 아침 햇살"
  description?: string;   // 스팟 한줄 설명
}

export interface OdiiStoryItem {
  tid: string;          // 관광지 ID
  tlid: string;         // 관광지 언어 ID
  stid: string;         // 이야기 ID
  stlid: string;        // 이야기 언어 ID
  title: string;        // 관광지/스토리 대표 제목
  audioTitle: string;   // 오디오 세부 제목
  speaker?: string;     // 해설자 / 성우
  category: OdiiCategory; // 카테고리
  distance?: string;    // 위치 거리
  mapX: string;         // 경도
  mapY: string;         // 위도
  script: string;       // 전체 대본 (자막)
  parsedScript?: ScriptLine[]; // 시간차 싱크 대본 라인 목록
  playTime: string;     // 재생 시간 (초 단위)
  formattedDuration?: string; // 재생 시간 (예: "8:24", "15:02")
  audioUrl: string;     // 오디오 MP3 스트리밍 URL
  imageUrl: string;     // 앨범아트 / 섬네일 이미지 URL
  badgeText?: string;   // 에디토리얼 뱃지
  locationName?: string; // 상세 장소명
  likesCount?: number;   // 좋아요/북마크 수
  waypoints?: TourWaypoint[]; // 🎬 시네마틱 공간 오디오 투어 경유지 목록
}

export interface OdiiStoryPage {
  items: OdiiStoryItem[];
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

export type OdiiRegion =
  | '경주'
  | '전주'
  | '안동'
  | '서울'
  | '제주'
  | '부산'
  | '대구';

/**
 * 🏛️ 외부 의존성 주입(Dependency Injection)을 위한 오디 API 서비스 추상화 인터페이스
 */
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
