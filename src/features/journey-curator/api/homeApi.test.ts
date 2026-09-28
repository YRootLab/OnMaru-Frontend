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

  it('passes category to curated-courses when provided', async () => {
    const calls: Array<{ path: string; options: ApiRequestOptions | undefined }> = [];
    const request = async <T,>(path: string, options?: ApiRequestOptions): Promise<T> => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasMore: false } as T;
    };
    const repository = createHomeRepository(request);

    await repository.listCuratedCourses('HANOK_STAY');

    expect(calls[0]).toEqual({ path: '/home/curated-courses', options: {
      method: 'GET',
      params: { limit: 20, category: 'HANOK_STAY' },
      cache: 'no-store',
    } });
  });

  it('treats languageStatus FALLBACK as a valid response', async () => {
    const request = async <T,>(): Promise<T> =>
      ({ items: [{ storyId: 's1', title: '여름 빗소리' }], basis: 'POPULARITY', languageStatus: 'FALLBACK' }) as T;
    const repository = createHomeRepository(request);
    const result = await repository.listPopularSounds();

    expect(result.items).toHaveLength(1);
    expect(result.languageStatus).toBe('FALLBACK');
  });
});
