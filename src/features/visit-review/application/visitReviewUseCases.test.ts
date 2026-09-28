import { describe, expect, it, vi } from 'vitest';
import type { VisitReviewRepository } from '../api/visitReviewApi';
import {
  createVisitReviewWarmth,
  listPlaceReviewWarmths,
  listReviewWarmths,
  listSelectableVisitReviewRegions,
} from './visitReviewUseCases';

function repository(overrides: Partial<VisitReviewRepository>): VisitReviewRepository {
  return {
    listRegions: vi.fn(),
    listReviews: vi.fn(),
    listReviewsByPlace: vi.fn(),
    createReview: vi.fn(),
    deleteReview: vi.fn(),
    setLiked: vi.fn(),
    reportReview: vi.fn(),
    ...overrides,
  } as VisitReviewRepository;
}

const publicReview = {
  id: 'review-1',
  placeId: 'p-jeonju-hanok-village',
  placeName: '전주 한옥마을',
  lat: 35.8151,
  lng: 127.153,
  text: '비 오는 날 처마 밑에서 쉬기 좋았습니다.',
  likeCount: 0,
  likedByMe: false,
  mine: true,
  createdAt: '2026-09-15T02:00:00Z',
};

describe('VisitReview use cases', () => {
  it('loads place reviews from the canonical place endpoint only', async () => {
    const repo = repository({
      listReviewsByPlace: vi.fn().mockResolvedValue({ items: [publicReview], nextCursor: null, hasMore: false }),
    });

    const result = await listPlaceReviewWarmths(repo, 'p-jeonju-hanok-village');

    expect(repo.listReviewsByPlace).toHaveBeenCalledWith('p-jeonju-hanok-village', { limit: 20 });
    expect(result).toEqual([expect.objectContaining({ id: 'review-1', placeId: 'p-jeonju-hanok-village' })]);
  });

  it('loads a selected region through the server scope instead of slicing the global page', async () => {
    const repo = repository({
      listReviews: vi.fn().mockResolvedValue({ items: [publicReview], nextCursor: null, hasMore: false }),
    });

    await listReviewWarmths(repo, 'kr-45-jeonju');

    expect(repo.listReviews).toHaveBeenCalledWith({
      scope: 'REGION',
      regionCode: 'kr-45-jeonju',
      limit: 20,
    });
  });

  it('rejects temporary place ids before attempting a write', async () => {
    const repo = repository({ createReview: vi.fn() });

    await expect(createVisitReviewWarmth(repo, {
      placeId: 'custom-123',
      text: '좋았어요.',
      mood: '한적',
      score: 5,
      tags: [],
    })).rejects.toThrow('canonical placeId');
    expect(repo.createReview).not.toHaveBeenCalled();
  });

  it('returns the server-created review only after persistence succeeds', async () => {
    const repo = repository({ createReview: vi.fn().mockResolvedValue(publicReview) });

    const result = await createVisitReviewWarmth(repo, {
      placeId: 'p-jeonju-hanok-village',
      text: '  비 오는 날 처마 밑에서 쉬기 좋았습니다.  ',
      mood: '한적',
      score: 5,
      tags: ['#처마'],
    });

    expect(repo.createReview).toHaveBeenCalledWith(
      'p-jeonju-hanok-village',
      '비 오는 날 처마 밑에서 쉬기 좋았습니다.',
      { mood: '한적', score: 5, tags: ['#처마'] },
    );
    expect(result).toEqual(expect.objectContaining({ id: 'review-1', mine: true }));
  });

  it('uses leaf region codes exposed by the server for regional filtering', async () => {
    const repo = repository({
      listRegions: vi.fn()
        .mockResolvedValueOnce({
          items: [
            { region: { regionCode: 'kr-11', parentRegionCode: null, name: '서울특별시', level: 'PROVINCE' }, reviewCount: 1 },
            { region: { regionCode: 'kr-45', parentRegionCode: null, name: '전북특별자치도', level: 'PROVINCE' }, reviewCount: 2 },
          ],
        })
        .mockResolvedValueOnce({
          items: [{ region: { regionCode: 'kr-11-jongno', parentRegionCode: 'kr-11', name: '종로구', level: 'CITY' }, reviewCount: 1 }],
        })
        .mockResolvedValueOnce({
          items: [{ region: { regionCode: 'kr-45-jeonju', parentRegionCode: 'kr-45', name: '전주시', level: 'CITY' }, reviewCount: 2 }],
        }),
    });

    const result = await listSelectableVisitReviewRegions(repo);

    expect(result.map((item) => item.region.regionCode)).toEqual(['kr-11-jongno', 'kr-45-jeonju']);
  });
});
