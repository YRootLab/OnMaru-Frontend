import { visitReviewToWarmth, visitReviewsToWarmths } from '@/features/map/warmth/visitReviewWarmthAdapter';
import type { Warmth } from '@/features/map/types';
import type { VisitReviewRepository } from '../api/visitReviewApi';
import type { VisitReviewRegionItem } from '../api/visitReviewContract';

type CreateVisitReviewInput = {
  placeId: string;
  text: string;
  mood?: '북적' | '한적';
  score?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
};

export async function listReviewWarmths(
  repository: VisitReviewRepository,
  regionCode?: string,
): Promise<Warmth[]> {
  const page = await repository.listReviews(
    regionCode
      ? { scope: 'REGION', regionCode, limit: 20 }
      : { scope: 'ALL', limit: 50 },
  );
  return visitReviewsToWarmths(page.items);
}

export async function listPlaceReviewWarmths(
  repository: VisitReviewRepository,
  placeId: string,
): Promise<Warmth[]> {
  const page = await repository.listReviewsByPlace(placeId, { limit: 20 });
  return visitReviewsToWarmths(page.items);
}

export async function listSelectableVisitReviewRegions(
  repository: VisitReviewRepository,
): Promise<VisitReviewRegionItem[]> {
  const topLevel = await repository.listRegions();
  const children = await Promise.all(
    topLevel.items.map((item) => repository.listRegions(item.region.regionCode)),
  );

  return children.flatMap((page, index) =>
    page.items.length > 0 ? page.items : [topLevel.items[index]],
  );
}

export async function createVisitReviewWarmth(
  repository: VisitReviewRepository,
  input: CreateVisitReviewInput,
): Promise<Warmth> {
  if (!input.placeId || input.placeId.startsWith('custom-')) {
    throw new Error('VisitReview requires a canonical placeId');
  }

  const review = await repository.createReview(input.placeId, input.text.trim(), {
    mood: input.mood,
    score: input.score,
    tags: input.tags,
  });
  return visitReviewToWarmth(review);
}
