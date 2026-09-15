import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { CursorPage } from '@/lib/api/cursor';
import type { VisitReview, VisitReviewPage, VisitReviewRegionItem, VisitReviewReportReason } from './visitReviewContract';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type VisitReviewRepository = {
  listRegions(parentRegionCode?: string): Promise<{ items: VisitReviewRegionItem[] }>;
  listReviews(input: {
    scope: 'ALL' | 'REGION';
    regionCode?: string;
    limit?: number;
    cursor?: string;
  }): Promise<VisitReviewPage>;
  createReview(placeId: string, text: string): Promise<VisitReview>;
  deleteReview(reviewId: string): Promise<void>;
  setLiked(reviewId: string, liked: boolean): Promise<{ likedByMe: boolean; likeCount: number }>;
  reportReview(reviewId: string, reason: VisitReviewReportReason, detail?: string): Promise<{ reportId: string; status: string }>;
};

export function createVisitReviewRepository(request: RequestFn = apiRequest): VisitReviewRepository {
  return {
    listRegions(parentRegionCode) {
      return request<{ items: VisitReviewRegionItem[] }>('/visit-review-regions', {
        method: 'GET',
        params: parentRegionCode ? { parentRegionCode } : {},
      });
    },
    listReviews(input) {
      return request<VisitReviewPage>('/visit-reviews', {
        method: 'GET',
        params: {
          scope: input.scope,
          regionCode: input.regionCode,
          limit: input.limit ?? 20,
          cursor: input.cursor,
        },
      });
    },
    createReview(placeId, text) {
      return request<VisitReview>(`/places/${placeId}/visit-reviews`, {
        method: 'POST',
        body: { text },
        csrf: true,
      });
    },
    deleteReview(reviewId) {
      return request<void>(`/visit-reviews/${reviewId}`, { method: 'DELETE', csrf: true });
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
    status: 'PUBLISHED',
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
    status: 'PUBLISHED',
  },
];

export const fixtureVisitReviewRepository: VisitReviewRepository = {
  async listRegions(parentRegionCode) {
    const items: VisitReviewRegionItem[] = parentRegionCode
      ? [
          {
            regionCode: '45113',
            parentRegionCode,
            name: '전주시 완산구',
            level: 'SIGUNGU',
            center: { lat: 35.812, lng: 127.146 },
            bounds: { west: 127.05, south: 35.75, east: 127.2, north: 35.88 },
            reviewCount: 17,
            coverageStatus: 'SUPPORTED',
            hasChildren: false,
          },
        ]
      : [
          {
            regionCode: '45',
            parentRegionCode: null,
            name: '전북',
            level: 'SIDO',
            center: { lat: 35.7175, lng: 127.153 },
            bounds: { west: 126.4, south: 35.3, east: 127.8, north: 36.2 },
            reviewCount: 28,
            coverageStatus: 'SUPPORTED',
            hasChildren: true,
          },
          {
            regionCode: '11',
            parentRegionCode: null,
            name: '서울',
            level: 'SIDO',
            center: { lat: 37.5665, lng: 126.978 },
            bounds: { west: 126.76, south: 37.42, east: 127.18, north: 37.7 },
            reviewCount: 14,
            coverageStatus: 'SUPPORTED',
            hasChildren: true,
          },
        ];
    return { items };
  },
  async listReviews(): Promise<CursorPage<VisitReview>> {
    return { items: fixtureReviews, nextCursor: null, hasMore: false };
  },
  async createReview(_placeId, text) {
    return { ...fixtureReviews[0], id: `fixture-review-${Date.now()}`, text, mine: true, likeCount: 0, likedByMe: false };
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
