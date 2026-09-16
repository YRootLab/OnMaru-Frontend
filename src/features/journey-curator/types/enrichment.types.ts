/**
 * 새 계약(exploration.types.ts) 밖의 "곁들이는 실데이터" 3종.
 * seven-day-mvp-fe-handoff.md의 공식 계약에는 없지만, 사용자가 요청해 기존 real
 * 서브시스템(HanokDetailService, sorimaruApiAdapter, TourAPI 음식점 검색)을 재사용해
 * 채운다 — 전부 실제 장소 좌표/contentId에 근거한다.
 */

export interface HanokDoganEntry {
  placeId: string;
  overview: string | null;
  usetime: string | null;
  restdate: string | null;
  images: string[];
  homepage: string | null;
}

export interface NearbyAudioStory {
  stid: string;
  title: string;
  audioTitle: string;
  audioUrl: string;
  distance?: string;
  formattedDuration: string;
  imageUrl: string;
  locationName: string;
}

export interface NearbyFoodPlace {
  id: string;
  title: string;
  addr: string;
  image: string | null;
  distanceMeters: number;
}
