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
