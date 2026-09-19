import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  백엔드 원본 응답 shape.

  /v3/api-docs가 이 엔드포인트들의 success response를 아직 문서화하지 않아서
  (200 응답이 `Record<string, never>`로만 내려온다) openapi-typescript 코드젠으로는
  타입을 뽑을 수 없었다. 대신 2026-09-19에 실서버(onmaru-backend.onrender.com)를
  직접 호출해 받은 실제 응답으로 아래 타입을 만들었다. 백엔드가 스키마를 채우면
  `npm run generate:api-types`로 다시 검증할 것.
*/
export interface BackendHanokListItem {
  placeId: string;
  name: string;
  category: string;
  regionName: string;
  thumbnailUrl: string | null;
  summary: string;
  tags: string[];
  savedByMe: boolean;
}

export interface BackendHanokListResponse {
  schemaVersion: string;
  items: BackendHanokListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface BackendPlaceDetail {
  schemaVersion: string;
  placeId: string;
  name: string;
  category: string;
  region: { regionCode: string; name: string };
  address: string;
  coordinates: { lat: number; lng: number };
  images: { url: string; alt: string }[];
  description: string;
  contentTags: string[];
  savedByMe: boolean;
}

export interface BackendMapPlaceItem {
  placeId: string;
  name: string;
  category: string;
  region: { regionCode: string; name: string; level: string; parentRegionCode: string | null };
  coordinates: { lat: number; lng: number };
  thumbnailUrl: string | null;
  summary: string;
  savedByMe: boolean;
  linkedOdiiStoryIds: string[];
  dataAvailability: { place: string; observation: string; odii: string };
}

export interface BackendMapPlacesResponse {
  schemaVersion: string;
  coverageStatus: string;
  language: string;
  items: BackendMapPlaceItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface HanokListParams {
  keyword?: string;
  regionCode?: string;
  category?: string;
  hasImage?: boolean;
  limit?: number;
  cursor?: string;
}

export interface MapPlacesBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface HanokRepository {
  listHanoks(params?: HanokListParams): Promise<BackendHanokListResponse>;
  getPlaceDetail(placeId: string): Promise<BackendPlaceDetail>;
  listMapPlaces(bounds: MapPlacesBounds): Promise<BackendMapPlacesResponse>;
}

export function createHanokRepository(request: RequestFn = apiRequest): HanokRepository {
  return {
    listHanoks(params) {
      return request<BackendHanokListResponse>('/hanoks', {
        method: 'GET',
        params,
        cache: 'no-store',
      });
    },
    getPlaceDetail(placeId) {
      return request<BackendPlaceDetail>(`/places/${encodeURIComponent(placeId)}`, {
        method: 'GET',
        cache: 'no-store',
      });
    },
    listMapPlaces(bounds) {
      return request<BackendMapPlacesResponse>('/map/places', {
        method: 'GET',
        params: bounds,
        cache: 'no-store',
      });
    },
  };
}

/*
  fixture는 실서버 스키마 검증(테스트)용이다.

  백엔드가 지금은 seed 데이터 2건(전주 한옥마을, 북촌 한옥 찻집)뿐이고 썸네일도
  cdn.onmaru.example이라는 실재하지 않는 도메인이다. 이 repository를 도감/지도
  화면의 기본 데이터 소스로 바로 연결하면 지금 실제로 쓰고 있는 전국 수집분
  데이터가 2건짜리 placeholder로 보이게 된다 — 그래서 이 repository는 완성되어
  있지만 아직 HanokArchive/HanokMap의 기본 소스로 연결하지 않았다. 백엔드가 전수
  데이터를 채운 뒤 defaultHanokRepository를 실제 화면에 연결한다.
*/
export const fixtureHanokRepository: HanokRepository = {
  async listHanoks() {
    return {
      schemaVersion: '1.2',
      items: [
        {
          placeId: 'p-jeonju-hanok-village',
          name: '전주 한옥마을',
          category: 'HANOK',
          regionName: '전북 전주시',
          thumbnailUrl: null,
          summary: '한옥 골목과 전통 체험을 함께 둘러볼 수 있는 대표 한옥 권역입니다.',
          tags: ['한옥', '체험', '산책'],
          savedByMe: false,
        },
      ],
      nextCursor: null,
      hasMore: false,
    };
  },
  async getPlaceDetail(placeId) {
    return {
      schemaVersion: '1.2',
      placeId,
      name: '전주 한옥마을',
      category: '한옥',
      region: { regionCode: 'kr-45-jeonju', name: '전북 전주시' },
      address: '전북 전주시 완산구 기린대로 99',
      coordinates: { lat: 35.8151, lng: 127.153 },
      images: [],
      description: '전통 한옥과 공예, 음식, 산책 코스를 한 번에 경험할 수 있는 공개 관광 장소입니다.',
      contentTags: ['한옥 골목', '공예 체험'],
      savedByMe: false,
    };
  },
  async listMapPlaces() {
    return {
      schemaVersion: '1.2',
      coverageStatus: 'PARTIAL',
      language: 'ko-KR',
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  },
};

export const defaultHanokRepository = createHanokRepository();
