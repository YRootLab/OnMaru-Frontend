import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import type { RankedPlace } from '../types';
import { toHttps } from '../utils/formatters';

interface RegionMeta {
  lat: number;
  lng: number;
  fallbacks: RankedPlace[];
}

const REGION_DATA: Record<string, RegionMeta> = {
  전주: {
    lat: 35.8149,
    lng: 127.1526,
    fallbacks: [
      { placeId: '126508', placeName: '전주한옥마을 경기전', placeType: '문화유산 · 대표명소', placeRegion: '전주', helpfulCount: 84, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=600&q=80' },
      { placeId: '126509', placeName: '전주 향교', placeType: '전통한옥 · 유학사당', placeRegion: '전주', helpfulCount: 62, congestionLevel: '여유', image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80' },
      { placeId: '126510', placeName: '전주 오목대', placeType: '역사명소 · 전망대', placeRegion: '전주', helpfulCount: 55, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80' },
      { placeId: '126511', placeName: '학인당 한옥스테이', placeType: '전통고택 · 숙소', placeRegion: '전주', helpfulCount: 47, congestionLevel: '여유', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80' },
      { placeId: '126512', placeName: '전주 전통술박물관', placeType: '전통문화체험', placeRegion: '전주', helpfulCount: 39, congestionLevel: '여유', image: null },
    ],
  },
  안동: {
    lat: 36.5393,
    lng: 128.5186,
    fallbacks: [
      { placeId: '126515', placeName: '안동 하회마을 양진당', placeType: '전통종택 · 보물', placeRegion: '안동', helpfulCount: 78, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80' },
      { placeId: '126516', placeName: '안동 하회마을 충효당', placeType: '서애 류성룡 종택', placeRegion: '안동', helpfulCount: 69, congestionLevel: '여유', image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80' },
      { placeId: '126517', placeName: '안동 병산서원', placeType: '유네스코 세계유산', placeRegion: '안동', helpfulCount: 58, congestionLevel: '여유', image: null },
      { placeId: '126518', placeName: '도산서원', placeType: '퇴계 이황 서원', placeRegion: '안동', helpfulCount: 51, congestionLevel: '보통', image: null },
    ],
  },
  경주: {
    lat: 35.8294,
    lng: 129.2181,
    fallbacks: [
      { placeId: '126521', placeName: '경주 교촌마을 최씨고택', placeType: '전통고택 · 노블레스', placeRegion: '경주', helpfulCount: 82, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=600&q=80' },
      { placeId: '126522', placeName: '경주 양동마을', placeType: '유네스코 세계유산', placeRegion: '경주', helpfulCount: 71, congestionLevel: '여유', image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80' },
      { placeId: '126523', placeName: '황리단길 한옥거리', placeType: '전통문화거리 · 카페', placeRegion: '경주', helpfulCount: 65, congestionLevel: '혼잡', image: null },
    ],
  },
  서울: {
    lat: 37.5826,
    lng: 126.9839,
    fallbacks: [
      { placeId: '2033624', placeName: '북촌 한옥마을 백인제가옥', placeType: '근대한옥 · 서울시민속문화재', placeRegion: '서울', helpfulCount: 91, congestionLevel: '혼잡', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80' },
      { placeId: '2033625', placeName: '은평 한옥마을 셋이서문학관', placeType: '전통한옥체험관', placeRegion: '서울', helpfulCount: 64, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80' },
      { placeId: '2033626', placeName: '남산골 한옥마을', placeType: '전통정원 · 전통가옥', placeRegion: '서울', helpfulCount: 59, congestionLevel: '보통', image: null },
    ],
  },
  담양: {
    lat: 35.3216,
    lng: 126.9882,
    fallbacks: [
      { placeId: '127622', placeName: '담양 소쇄원', placeType: '조선 정원 · 명승', placeRegion: '담양', helpfulCount: 76, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80' },
      { placeId: '127623', placeName: '담양 식영정', placeType: '전통정자 · 가사문학', placeRegion: '담양', helpfulCount: 48, congestionLevel: '여유', image: null },
    ],
  },
  강릉: {
    lat: 37.7892,
    lng: 128.8931,
    fallbacks: [
      { placeId: '126520', placeName: '강릉 선교장', placeType: '전통사대부가옥 · 국가민속문화재', placeRegion: '강릉', helpfulCount: 88, congestionLevel: '보통', image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=600&q=80' },
      { placeId: '126524', placeName: '오죽헌 몽룡실', placeType: '신사임당 율곡이이 생가', placeRegion: '강릉', helpfulCount: 72, congestionLevel: '보통', image: null },
    ],
  },
  제주: {
    lat: 33.3871,
    lng: 126.7972,
    fallbacks: [
      { placeId: '127640', placeName: '제주 성읍민속마을', placeType: '전통초가 · 국가민속문화재', placeRegion: '제주', helpfulCount: 68, congestionLevel: '여유', image: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80' },
      { placeId: '127641', placeName: '제주 목관아', placeType: '조선시대 관아건축', placeRegion: '제주', helpfulCount: 52, congestionLevel: '여유', image: null },
    ],
  },
};

export class PopularPlaceService {
  /**
   * 지역별 인기 한옥 장소 랭킹 목록 및 1위 대표 장소를 조회합니다.
   */
  public static async getPopularPlaces(region = 'all'): Promise<{
    region: string;
    items: RankedPlace[];
    topPlace: RankedPlace;
  }> {
    const targetMeta = REGION_DATA[region] || REGION_DATA['전주'];
    const allFallbacks =
      region === 'all'
        ? Object.values(REGION_DATA).flatMap((r) => r.fallbacks)
        : targetMeta.fallbacks;

    try {
      const json = await TourApiClient.get('locationBasedList2', {
        mapX: targetMeta.lng,
        mapY: targetMeta.lat,
        radius: 20000,
        contentTypeId: 12,
        arrange: 'P',
        numOfRows: 10,
      });

      const rawList = json?.response?.body?.items?.item;
      const list = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];

      if (list.length > 0) {
        const items: RankedPlace[] = list.map((item: any, idx: number) => ({
          placeId: String(item.contentid || `pop-${idx}`),
          placeName: String(item.title || ''),
          placeType: '전통문화 · 인기명소',
          placeRegion: region === 'all' ? '전국' : region,
          helpfulCount: Math.max(12, 90 - idx * 7),
          congestionLevel: idx === 0 ? '혼잡' : idx < 3 ? '보통' : '여유',
          image:
            toHttps(item.firstimage || item.firstimage2) ||
            allFallbacks[idx % allFallbacks.length]?.image ||
            null,
          lat: Number(item.mapy) || targetMeta.lat,
          lng: Number(item.mapx) || targetMeta.lng,
        }));

        return {
          region: region === 'all' ? '전국' : region,
          items,
          topPlace: items[0],
        };
      }
    } catch {
      // 폴백 처리
    }

    return {
      region: region === 'all' ? '전국' : region,
      items: allFallbacks,
      topPlace: allFallbacks[0],
    };
  }
}
