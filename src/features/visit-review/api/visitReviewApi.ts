import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { CursorPage } from '@/lib/api/cursor';
import type { VisitReview, VisitReviewPage, VisitReviewRegionItem, VisitReviewReportReason } from './visitReviewContract';
import { createVisitReviewQueryCache, type VisitReviewQueryCache } from './visitReviewQueryCache';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type VisitReviewRepository = {
  listRegions(parentRegionCode?: string): Promise<{ items: VisitReviewRegionItem[] }>;
  listReviews(input: {
    scope: 'ALL' | 'REGION' | 'MY';
    regionCode?: string;
    limit?: number;
    cursor?: string;
  }): Promise<VisitReviewPage>;
  listReviewsByPlace(placeId: string, input?: { limit?: number; cursor?: string }): Promise<VisitReviewPage>;
  createReview(placeId: string, text: string, opts?: { mood?: '북적' | '한적'; score?: 1 | 2 | 3 | 4 | 5; tags?: string[] }): Promise<VisitReview>;
  deleteReview(reviewId: string): Promise<void>;
  setLiked(reviewId: string, liked: boolean): Promise<{ likedByMe: boolean; likeCount: number }>;
  reportReview(reviewId: string, reason: VisitReviewReportReason, detail?: string): Promise<{ reportId: string; status: string }>;
};

export function createVisitReviewRepository(
  request: RequestFn = apiRequest,
  queryCache: VisitReviewQueryCache = createVisitReviewQueryCache(),
): VisitReviewRepository {
  return {
    listRegions(parentRegionCode) {
      const key = `regions:${parentRegionCode ?? 'root'}`;
      return queryCache.get(key, () =>
        request<{ items: VisitReviewRegionItem[] }>('/visit-review-regions', {
          method: 'GET',
          params: parentRegionCode ? { parentRegionCode } : {},
        }),
      );
    },
    listReviews(input) {
      const key = `feed:${input.scope}:${input.regionCode ?? ''}:${input.limit ?? 20}:${input.cursor ?? ''}`;
      return queryCache.get(key, () =>
        request<VisitReviewPage>('/visit-reviews', {
          method: 'GET',
          params: {
            scope: input.scope,
            regionCode: input.regionCode,
            limit: input.limit ?? 20,
            cursor: input.cursor,
          },
        }),
      );
    },
    listReviewsByPlace(placeId, input) {
      const key = `place:${placeId}:${input?.limit ?? 20}:${input?.cursor ?? ''}`;
      return queryCache.get(key, () =>
        request<VisitReviewPage>(`/places/${placeId}/visit-reviews`, {
          method: 'GET',
          params: { limit: input?.limit ?? 20, cursor: input?.cursor },
        }),
      );
    },
    async createReview(placeId, text, opts) {
      const review = await request<VisitReview>(`/places/${placeId}/visit-reviews`, {
        method: 'POST',
        body: { text, ...opts },
        csrf: true,
        idempotencyKey: globalThis.crypto.randomUUID(),
      });
      queryCache.invalidate('feed:');
      queryCache.invalidate(`place:${placeId}:`);
      return review;
    },
    async deleteReview(reviewId) {
      await request<void>(`/visit-reviews/${reviewId}`, { method: 'DELETE', csrf: true });
      queryCache.invalidate('feed:');
      queryCache.invalidate('place:');
    },
    setLiked(reviewId, liked) {
      return request<{ likedByMe: boolean; likeCount: number }>(`/visit-reviews/${reviewId}/likes/me`, {
        method: liked ? 'PUT' : 'DELETE',
        csrf: true,
      });
    },
    reportReview(reviewId, reason, detail) {
      return request<{ reportId: string; status: string }>(`/visit-reviews/${reviewId}/reports`, {
        method: 'POST',
        body: { reason, detail },
        csrf: true,
      });
    },
  };
}

const fixtureReviews: VisitReview[] = [
  {
    id: 'review-jeonju-1',
    placeId: 'p-hanok-01',
    placeName: '전주 한옥마을',
    lat: 35.812,
    lng: 127.146,
    text: '해 질 무렵 골목을 따라 걷기 좋았어요. 짧게 머물러도 한옥의 결이 잘 느껴졌습니다.',
    likeCount: 12,
    likedByMe: false,
    mine: false,
    createdAt: '2026-09-13T10:30:00.000Z',
  },
  {
    id: 'review-jeonju-2',
    placeId: 'p-cafe-01',
    placeName: '한옥 차방',
    lat: 35.813,
    lng: 127.148,
    text: '차 한 잔 마시며 쉬기 좋았고, 안내가 조용해서 여행 중간 쉼표로 괜찮았습니다.',
    likeCount: 5,
    likedByMe: true,
    mine: false,
    createdAt: '2026-09-12T07:00:00.000Z',
  },
];

export const fixtureVisitReviewRepository: VisitReviewRepository = {
  async listRegions(parentRegionCode) {
    const items: VisitReviewRegionItem[] = parentRegionCode
      ? [
          {
            region: parentRegionCode === 'kr-11'
              ? { regionCode: 'kr-11-jongno', parentRegionCode, name: '종로구', level: 'CITY' }
              : { regionCode: 'kr-45-jeonju', parentRegionCode, name: '전주시', level: 'CITY' },
            reviewCount: 17,
          },
        ]
      : [
          {
            region: { regionCode: 'kr-45', parentRegionCode: null, name: '전북특별자치도', level: 'PROVINCE' },
            reviewCount: 28,
          },
          {
            region: { regionCode: 'kr-11', parentRegionCode: null, name: '서울특별시', level: 'PROVINCE' },
            reviewCount: 14,
          },
        ];
    return { items };
  },
  async listReviews(): Promise<CursorPage<VisitReview>> {
    return { items: fixtureReviews, nextCursor: null, hasMore: false };
  },
  async listReviewsByPlace(placeId): Promise<CursorPage<VisitReview>> {
    return { items: fixtureReviews.filter((r) => r.placeId === placeId), nextCursor: null, hasMore: false };
  },
  async createReview(_placeId, text, opts) {
    return { ...fixtureReviews[0], id: `fixture-review-${Date.now()}`, text, ...opts, mine: true, likeCount: 0, likedByMe: false };
  },
  async deleteReview() {},
  async setLiked(_reviewId, liked) {
    return { likedByMe: liked, likeCount: liked ? 13 : 12 };
  },
  async reportReview() {
    return { reportId: 'fixture-report', status: 'RECEIVED' };
  },
};

export const defaultVisitReviewRepository = USE_MOCK ? fixtureVisitReviewRepository : createVisitReviewRepository();
