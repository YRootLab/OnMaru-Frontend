import { describe, expect, it } from 'vitest';
import type { ApiRequestOptions } from '@/lib/api/client';
import { createHomeRepository } from './homeApi';

describe('home repository', () => {
  it('uses the home endpoints and their required query parameters', async () => {
    const calls: Array<{ path: string; options: ApiRequestOptions | undefined }> = [];
    const request = async <T,>(path: string, options?: ApiRequestOptions): Promise<T> => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasMore: false } as T;
    };
    const repository = createHomeRepository(request);

    await repository.listCuratedCourses();
    await repository.listTrendingSounds();
    await repository.listPopularRegions();

    expect(calls[0]).toEqual({ path: '/home/curated-courses', options: {
      method: 'GET',
      params: { limit: 20 },
      cache: 'no-store',
    } });
    expect(calls[1]).toEqual({ path: '/home/trending-sounds', options: {
      method: 'GET',
      params: { language: 'ko-KR', limit: 20 },
      cache: 'no-store',
    } });
    expect(calls[2]).toEqual({ path: '/home/popular-regions', options: {
      method: 'GET',
      cache: 'no-store',
    } });
  });
});
