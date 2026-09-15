import type { Warmth } from '@/features/map/types';
import type { VisitReview } from '@/features/visit-review/api/visitReviewContract';

export function visitReviewToWarmth(review: VisitReview): Warmth {
  return {
    id: review.id,
    placeId: review.placeId,
    placeName: review.placeName,
    lat: review.lat,
    lng: review.lng,
    text: review.text,
    mood: '한적',
    score: review.likedByMe ? 3 : 2,
    tags: [],
    createdAt: review.createdAt,
    mine: review.mine,
  };
}

export function visitReviewsToWarmths(reviews: VisitReview[]): Warmth[] {
  return reviews
    .filter((review) => review.status === 'PUBLISHED')
    .map(visitReviewToWarmth);
}
