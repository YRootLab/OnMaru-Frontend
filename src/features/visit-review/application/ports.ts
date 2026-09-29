import type { VisitReview, VisitReviewPage, VisitReviewRegionItem, VisitReviewReportReason } from '../domain/review';

export type { VisitReviewReportReason };

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
