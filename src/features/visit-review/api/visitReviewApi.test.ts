import { describe, expect, it } from 'vitest';
import { createVisitReviewRepository as createApiRepository } from './visitReviewApi';
import { createVisitReviewRepository as createInfraRepository } from '../infrastructure/visitReviewRepository';

const implementations = [
  { name: 'infrastructure/visitReviewRepository (production factory)', factory: createInfraRepository },
  { name: 'api/visitReviewApi (legacy factory)', factory: createApiRepository },
];

describe.each(implementations)('$name', ({ factory }) => {
  it('loads region aggregates before explicit region review bodies', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = factory((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasMore: false };
    }) as never);

    await repository.listRegions();
    await repository.listRegions('11');
    await repository.listReviews({ scope: 'REGION', regionCode: '11110', limit: 20 });

    expect(calls).toEqual([
      { path: '/visit-review-regions', options: { method: 'GET', params: {} } },
      { path: '/visit-review-regions', options: { method: 'GET', params: { parentRegionCode: '11' } } },
      {
        path: '/visit-reviews',
        options: { method: 'GET', params: { scope: 'REGION', regionCode: '11110', limit: 20, cursor: undefined } },
      },
    ]);
  });

  it('loads reviews scoped to a single place (FE #92)', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = factory((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasMore: false };
    }) as never);

    await repository.listReviewsByPlace('p-jeonju-hanok-village');

    expect(calls).toEqual([
      {
        path: '/places/p-jeonju-hanok-village/visit-reviews',
        options: { method: 'GET', params: { limit: 20, cursor: undefined } },
      },
    ]);
  });

  it('uses intended like state endpoints instead of toggle', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = factory((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { likedByMe: true, likeCount: 1 };
    }) as never);

    await repository.setLiked('review-1', true);
    await repository.setLiked('review-1', false);

    expect(calls).toEqual([
      { path: '/visit-reviews/review-1/likes/me', options: { method: 'PUT', csrf: true } },
      { path: '/visit-reviews/review-1/likes/me', options: { method: 'DELETE', csrf: true } },
    ]);
  });

  it('adds an idempotency key when creating a review', async () => {
    const calls: Array<{ path: string; options: any }> = [];
    const repository = factory((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { id: 'review-1' };
    }) as never);

    await repository.createReview('p-jeonju-hanok-village', '비 오는 날 좋았어요.');

    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/places/p-jeonju-hanok-village/visit-reviews');
    expect(calls[0].options).toMatchObject({
      method: 'POST',
      body: { text: '비 오는 날 좋았어요.' },
      csrf: true,
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });

  it('posts external place review to /visit-reviews with place payload (Issue #643)', async () => {
    const calls: Array<{ path: string; options: any }> = [];
    const repository = factory((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { id: 'review-ext-1', placeId: 'p-ext-18577297' };
    }) as never);

    await repository.createExternalPlaceReview(
      {
        provider: 'KAKAO',
        externalId: '18577297',
        name: '경기전 돌담길',
        lat: 35.815,
        lng: 127.15,
      },
      '돌담길 산책 코스로 최고예요.',
      { mood: '한적', score: 5, tags: [] },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/visit-reviews');
    expect(calls[0].options).toMatchObject({
      method: 'POST',
      body: {
        place: {
          provider: 'KAKAO',
          externalId: '18577297',
          name: '경기전 돌담길',
          lat: 35.815,
          lng: 127.15,
        },
        text: '돌담길 산책 코스로 최고예요.',
        mood: '한적',
        score: 5,
        tags: [],
      },
      csrf: true,
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });
});
