import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type HomeCursorPage<T> = {
  schemaVersion: '1.2';
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CuratedCourse = {
  placeId: string;
  name: string;
  category: string;
  regionName: string;
  thumbnailUrl: string | null;
  summary: string;
  tags: string[];
  saved: boolean;
};

export type TrendingSound = {
  stid: string;
  title: string;
  audioTitle?: string;
  locationName?: string;
  formattedDuration?: string;
  playTime?: string;
};

export type PopularRegion = {
  region: {
    regionCode: string;
    parentRegionCode: string | null;
    name: string;
    level: string;
  };
  reviewCount: number;
};

export type HomeRepository = {
  listCuratedCourses(): Promise<HomeCursorPage<CuratedCourse>>;
  listTrendingSounds(): Promise<HomeCursorPage<TrendingSound>>;
  listPopularRegions(): Promise<{ items: PopularRegion[] }>;
};

export function createHomeRepository(request: RequestFn = apiRequest): HomeRepository {
  return {
    listCuratedCourses() {
      return request<HomeCursorPage<CuratedCourse>>('/home/curated-courses', {
        method: 'GET',
        params: { limit: 20 },
        cache: 'no-store',
      });
    },
    listTrendingSounds() {
      return request<HomeCursorPage<TrendingSound>>('/home/trending-sounds', {
        method: 'GET',
        params: { language: 'ko-KR', limit: 20 },
        cache: 'no-store',
      });
    },
    listPopularRegions() {
      return request<{ items: PopularRegion[] }>('/home/popular-regions', {
        method: 'GET',
        cache: 'no-store',
      });
    },
  };
}

export const homeRepository = createHomeRepository();
