import { describe, expect, it, vi } from 'vitest';
import { createVisitReviewQueryCache } from './visitReviewQueryCache';

describe('VisitReview query cache', () => {
  it('shares one in-flight request across concurrently mounted feed views', async () => {
    let resolveRequest!: (value: string[]) => void;
    const loader = vi.fn(() => new Promise<string[]>((resolve) => {
      resolveRequest = resolve;
    }));
    const cache = createVisitReviewQueryCache(() => 1_000);

    const first = cache.get('feed:ALL', loader);
    const second = cache.get('feed:ALL', loader);
    resolveRequest(['review-1']);

    await expect(Promise.all([first, second])).resolves.toEqual([
      ['review-1'],
      ['review-1'],
    ]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh request after invalidation', async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce(['review-1'])
      .mockResolvedValueOnce(['review-2']);
    const cache = createVisitReviewQueryCache(() => 1_000);

    await cache.get('feed:ALL', loader);
    cache.invalidate('feed:');

    await expect(cache.get('feed:ALL', loader)).resolves.toEqual(['review-2']);
  });
});
