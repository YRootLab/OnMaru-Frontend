import { describe, expect, it } from 'vitest';
import { filterWarmth, toReview } from './warmthRepo';
import { visitReviewsToWarmths } from './visitReviewWarmthAdapter';

describe('visitReviewsToWarmths', () => {
  it('keeps the WarmthFeed model so existing region and category filters continue to work', () => {
    const [warmth] = visitReviewsToWarmths([
      {
        id: 'review-1',
        placeId: 'p-bukchon',
        placeName: '북촌 한옥마을',
        lat: 37.5826,
        lng: 126.9832,
        text: '조용하게 걷기 좋았어요.',
        likeCount: 3,
        likedByMe: false,
        mine: true,
        createdAt: new Date().toISOString(),
        status: 'PUBLISHED',
      },
    ]);

    expect(warmth).toMatchObject({
      id: 'review-1',
      placeId: 'p-bukchon',
      placeName: '북촌 한옥마을',
      mood: '한적',
      score: 2,
      mine: true,
    });
    expect(toReview(warmth).placeRegion).toBe('서울');
    expect(filterWarmth([warmth], 'quiet')).toHaveLength(1);
    expect(filterWarmth([warmth], 'mine')).toHaveLength(1);
  });
});
