export type MapMode = 'info' | 'warmth';
export type SheetSnap = 'peek' | 'half' | 'full';

/** 정보지도 카테고리. TourAPI contentTypeId/cat3와 1:1로 대응한다 (src/lib/tourapiPlaces.ts). */
export type PlaceCategory = 'spot' | 'stay' | 'food' | 'cafe' | 'market';

/** 온기지도 필터. 데이터가 아니라 보기 방식이라 Warmth에는 안 들어간다. */
export type WarmthFilter = 'all' | 'busy' | 'quiet' | 'today' | 'recent';

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
  createdAt: string;
  /** 내가 남긴 것 — 로컬 저장분에만 붙는다. */
  mine?: boolean;
}

/** 격자 집계 결과. 셀 하나가 blob 하나가 된다. */
export interface WarmthCell {
  key: string;
  lat: number;
  lng: number;
  count: number;
  /** 셀 안에서 가장 최근 온기 — blob 라벨/미리보기용. */
  latest: Warmth;
}

/**
 * 카카오 SDK는 전역 window.kakao로 들어온다 (src/types/kakao.d.ts).
 * 공식 타입 패키지가 없어 프로젝트 관례대로 any를 그대로 쓴다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KakaoMap = any;
