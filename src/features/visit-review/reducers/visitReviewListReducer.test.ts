import { describe, expect, it } from 'vitest';
import { validateVisitReviewText } from '../api/visitReviewContract';
import { createInitialVisitReviewListState, reduceVisitReviewListState } from './visitReviewListReducer';

describe('visit review contract state', () => {
  it('validates review text as 1 to 300 code points with at most 5 lines', () => {
    expect(validateVisitReviewText('  좋은 한옥 경험이었어요\r\n다시 가고 싶어요  ')).toEqual({
      ok: true,
      value: '좋은 한옥 경험이었어요\n다시 가고 싶어요',
    });
    expect(validateVisitReviewText('')).toEqual({ ok: false, reason: 'empty' });
    expect(validateVisitReviewText('a'.repeat(301))).toEqual({ ok: false, reason: 'tooLong' });
    expect(validateVisitReviewText('1\n2\n3\n4\n5\n6')).toEqual({ ok: false, reason: 'tooManyLines' });
  });

  it('keeps previous reviews when stale region response arrives', () => {
    const initial = reduceVisitReviewListState(createInitialVisitReviewListState(), {
      type: 'region-load-started',
      requestSeq: 1,
      regionCode: '11',
    });
    const newer = reduceVisitReviewListState(initial, {
      type: 'region-load-started',
      requestSeq: 2,
      regionCode: '45',
    });
    const loaded = reduceVisitReviewListState(newer, {
      type: 'region-load-succeeded',
      requestSeq: 2,
      page: {
        items: [
          {
            id: 'r2',
            placeId: 'p2',
            placeName: '전주 한옥마을',
            lat: 35.812,
            lng: 127.146,
            text: '전주 후기',
            likeCount: 0,
            likedByMe: false,
            mine: false,
            createdAt: '2026-09-14T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    });
    const stale = reduceVisitReviewListState(loaded, {
      type: 'region-load-succeeded',
      requestSeq: 1,
      page: {
        items: [
          {
            id: 'r1',
            placeId: 'p1',
            placeName: '북촌 한옥마을',
            lat: 37.5826,
            lng: 126.9832,
            text: '서울 후기',
            likeCount: 0,
            likedByMe: false,
            mine: false,
            createdAt: '2026-09-14T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    });

    expect(stale.reviews.map((review) => review.id)).toEqual(['r2']);
    expect(stale.selectedRegionCode).toBe('45');
  });
});
