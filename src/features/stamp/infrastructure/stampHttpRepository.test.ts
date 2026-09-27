import { describe, expect, it, vi } from 'vitest';
import { createStampHttpRepository } from './stampHttpRepository';

describe('stamp HTTP repository', () => {
  it('rejects an invalid catalog payload at the infrastructure boundary', async () => {
    const repository = createStampHttpRepository(async () => ({
      success: true,
      message: 'Mock response',
      path: '/stamps',
    }));

    await expect(repository.getCatalog()).rejects.toThrow('Invalid stamp catalog response');
  });

  it('uses the API 1.3 paths and no-store policy', async () => {
    const request = vi.fn(async (path: string) => (
      path === '/stamps' ? { schemaVersion: '1.3', stamps: [] } : {}
    ));
    const repository = createStampHttpRepository(request);

    await repository.getCatalog();
    await repository.getMyStampBook();
    await repository.getLeaderboard(20);
    await repository.getMyRanking();
    await repository.updateRankingParticipation(true);

    expect(request.mock.calls).toEqual([
      ['/stamps', { method: 'GET', cache: 'no-store' }],
      ['/me/stamp-book', { method: 'GET', cache: 'no-store' }],
      ['/stamps/leaderboard', { method: 'GET', params: { limit: 20 }, cache: 'no-store' }],
      ['/me/stamp-ranking', { method: 'GET', cache: 'no-store' }],
      ['/me/stamp-ranking', {
        method: 'PUT',
        body: { participating: true },
        cache: 'no-store',
        csrf: true,
      }],
    ]);
  });

  it('sends check-in coordinates only in the body with csrf and the supplied idempotency key', async () => {
    const request = vi.fn(async () => ({}));
    const repository = createStampHttpRepository(request);
    const payload = { latitude: 37.5826, longitude: 126.9831, accuracyMeters: 18.4 };

    await repository.checkIn('place/북촌', payload, '00000000-0000-4000-8000-000000000001');

    expect(request).toHaveBeenCalledWith('/places/place%2F%EB%B6%81%EC%B4%8C/check-ins', {
      method: 'POST',
      body: payload,
      cache: 'no-store',
      csrf: true,
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
    });
  });
});
