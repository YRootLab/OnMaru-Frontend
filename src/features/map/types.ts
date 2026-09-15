export type MapMode = 'info' | 'warmth';
export type SheetSnap = 'peek' | 'half' | 'full';

/** 정보지도 카테고리. TourAPI contentTypeId/cat3와 1:1로 대응한다 (src/map/services/place.service.ts). */
export type PlaceCategory =
  | 'spot'
  | 'experience'
  | 'culture'
  | 'festival'
  | 'stay'
  | 'food'
  | 'cafe'
  | 'market';

/**
 * 온기지도 필터. 데이터가 아니라 보기 방식이라 Warmth에는 안 들어간다.
 * 여기 있는 값과 CategoryChips의 온기 칩 목록, warmthRepo.filterWarmth의 switch가
 * 셋 다 같은 집합이어야 한다 — 예전엔 'recent'는 아무도 안 쓰고 'review'는 무동작이었다.
 */
export type WarmthFilter = 'all' | 'busy' | 'quiet' | 'today' | 'mine';

export interface LatLng {
  lat: number;
  lng: number;
}

/** 지도 위 한 지점. TourAPI 응답을 이 모양으로 눌러 담는다. */
export interface Item {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  addr: string;
  image: string | null;
  tel: string | null;
  /** 검색 중심으로부터의 거리(m). TourAPI dist를 그대로 쓴다. */
  dist: number | null;
  /** 정통 한옥·문화재·고택 엔티티 여부 (일반 숙소/시설과 차별화) */
  isTraditional?: boolean;
  /** 로그인 회원 기준 backend canonical PLACE 찜 여부 */
  savedByMe?: boolean;
}

/** 한 줄 온기. 당근 한줄평처럼 짧게, 장소 하나에 여러 개가 쌓인다. */
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
  /** 내가 남긴 것 — 로컬 저장분에만 붙는다. */
  mine?: boolean;
  /** 한국관광 데이터랩 빅데이터 외지인 방문객 수 (TOUR_API_VISITOR_KEY) */
  visitorCount?: number;
}

/** 온기모드 상세 후기 피드 리뷰 */
export interface WarmthReview {
  id: string;
  placeId: string;
  placeName: string;
  placeRegion: string;
  /** 분류를 아는 경우에만 채운다. 모르면 빈 문자열 — 지어내지 않는다. */
  placeType: string;
  mood: 1 | 2 | 3 | 4 | 5;
  /** 정취 분위기 (북적이는 활기 vs 한적한 고즈넉함) */
  crowdMood?: '북적' | '한적';
  season: '봄' | '여름' | '가을' | '겨울';
  visitCount?: number;
  goodTags: string[];
  goodText?: string;
  badTags: string[];
  badText?: string;
  /** ISO 8601. 표시용 문자열이 아니다 — 정렬에 Date.parse로 들어간다. */
  createdAt: string;
  helpfulCount: number;
  isHelpful?: boolean;
  /** 내가 남긴 것 */
  mine?: boolean;
}

/** 실시간 인기 장소 랭킹 데이터 */
export interface RankedPlace {
  placeId: string;
  placeName: string;
  placeType: string;
  placeRegion: string;
  image: string | null;
  lat?: number;
  lng?: number;
}

/** 장소 상세 정보 데이터 */
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

/** 격자 집계 결과. 셀 하나가 blob 하나가 된다. */
export interface WarmthCell {
  key: string;
  lat: number;
  lng: number;
  count: number;
  /** 셀 안에서 가장 최근 온기 — blob 라벨/미리보기용. */
  latest: Warmth;
  /** 셀에 묶인 온기 전부. 분위기(북적/한적) 비율을 여기서 낸다. */
  items: Warmth[];
}

/**
 * 온마루 실시간 관광객 수요 집중도 및 혼잡도 지표 (TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY 기반)
 */
export type CongestionLevel = 'relaxed' | 'moderate' | 'busy' | 'surge';

export interface HeatSpot {
  id: string;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
  visitorCount: number;      // 외지인 방문객수
  congestionScore: number;   // 0~100 혼잡도 종합 지수
  congestionLevel: CongestionLevel; // 'relaxed' | 'moderate' | 'busy' | 'surge'
  surgeMultiplier: number;   // 1.0x ~ 3.5x 수요 집중 배율
  intensity: number;         // 0.15 ~ 1.0 히트 블룸 확산 강도
  /**
   * 날짜별 혼잡도(0~100). heatDays와 길이가 같다.
   * 날짜를 문지를 때마다 서버를 다시 부르지 않으려고 시계열째로 받아둔다.
   * 시계열이 없는 권역은 비어 있고, 그때는 congestionScore 하나로 버틴다.
   */
  series?: number[];
  updatedAt?: string;
}

/** 스크러버가 훑는 날짜 한 칸. weekday는 데이터랩이 주는 '월요일' 형태 그대로다. */
export interface HeatDay {
  ymd: string;
  weekday: string;
}

/**
 * 카카오 SDK는 전역 window.kakao로 들어온다 (src/types/kakao.d.ts).
 * 공식 타입 패키지가 없어 프로젝트 관례대로 any를 그대로 쓴다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KakaoMap = any;
