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
  savedByMe: boolean;
};

export type TrendingSound = {
  storyId: string;
  title: string;
  audioTitle?: string;
  locationName?: string;
  formattedDuration?: string;
  playTime?: string;
  rank?: number;
  score?: number;
  playCount?: number;
  saveCount?: number;
  savedByMe?: boolean;
};

export type PopularSound = TrendingSound & {
  story?: {
    storyId: string;
    title: string;
    category?: string;
    region?: { name?: string };
    durationSeconds?: number;
    imageUrl?: string | null;
    savedByMe?: boolean;
  };
};

export type LanguageStatus = 'OK' | 'FALLBACK' | 'FALLBACK_RECENT';

export type PopularRegion = {
  region: {
    regionCode: string;
    parentRegionCode: string | null;
    name: string;
    level: string;
  };
  reviewCount: number;
};

export type PopularSoundsResponse = { items: PopularSound[]; basis?: string; languageStatus?: LanguageStatus };

export type HomeRepository = {
  listCuratedCourses(category?: string): Promise<HomeCursorPage<CuratedCourse>>;
  listTrendingSounds(): Promise<HomeCursorPage<TrendingSound>>;
  listPopularSounds(input?: { limit?: number; window?: 'week' | 'all'; language?: string }): Promise<PopularSoundsResponse>;
  listPopularRegions(): Promise<{ items: PopularRegion[] }>;
};

export function createHomeRepository(request: RequestFn = apiRequest): HomeRepository {
  return {
    listCuratedCourses(category?: string) {
      return request<HomeCursorPage<CuratedCourse>>('/home/curated-courses', {
        method: 'GET',
        params: { limit: 20, ...(category ? { category } : {}) },
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
    listPopularSounds(input = {}) {
      return request<PopularSoundsResponse>('/home/popular-sounds', {
        method: 'GET',
        params: { limit: input.limit ?? 7, window: input.window ?? 'week', language: input.language ?? 'ko-KR' },
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
