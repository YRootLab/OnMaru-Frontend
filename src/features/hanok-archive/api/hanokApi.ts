import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;










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
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
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
  bbox: string; // minLng,minLat,maxLng,maxLat
  regionCode?: string;
  limit?: number;
}

export function boundsToMapPlacesBounds(swLat: number, swLng: number, neLat: number, neLng: number): MapPlacesBounds {
  return { bbox: `${swLng},${swLat},${neLng},${neLat}` };
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
