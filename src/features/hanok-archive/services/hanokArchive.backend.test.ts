import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

const tourApiGetMock = vi.fn();
vi.mock('@/lib/tour-api/tourApiClient', () => ({
  TourApiClient: { get: (...args: unknown[]) => tourApiGetMock(...args) },
}));

describe('HanokArchiveService.fetchRealtimeHanoks (FE #90)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    apiGetMock.mockReset();
    tourApiGetMock.mockReset();
    tourApiGetMock.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    vi.resetModules();
  });

  it('renders backend data when the backend responds successfully', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({
      items: [
        {
          placeId: 'p-1',
          name: '전주 한옥마을',
          category: 'HANOK',
          regionName: '전북 전주시',
          thumbnailUrl: null,
          summary: '설명',
          tags: ['한옥'],
        },
        {
          placeId: 'p-2',
          name: '북촌 한옥 찻집',
          category: 'HANOK_CAFE',
          regionName: '서울 종로구',
          thumbnailUrl: null,
          summary: '카페',
          tags: ['카페'],
        },
      ],
    });

    const { HanokArchiveService } = await import('./hanokArchive.service');
    const result = await HanokArchiveService.fetchRealtimeHanoks();

    expect(apiGetMock).toHaveBeenCalledWith('/hanoks', { limit: 50 });

    expect(result.villages).toHaveLength(1);
    expect(result.villages[0]).toMatchObject({ id: 'p-1', name: '전주 한옥마을', type: '고택' });
    expect(result.meta.total).toBe(1);
  });

  it('falls back to the TourAPI path when the backend request fails', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockRejectedValue(new Error('network error'));

    const { HanokArchiveService } = await import('./hanokArchive.service');
    const result = await HanokArchiveService.fetchRealtimeHanoks();

    expect(apiGetMock).toHaveBeenCalled();
    expect(tourApiGetMock).toHaveBeenCalled();
    expect(result.villages).toEqual([]);
  });

  it('skips the backend entirely when NEXT_PUBLIC_API_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const { HanokArchiveService } = await import('./hanokArchive.service');
    await HanokArchiveService.fetchRealtimeHanoks();

    expect(apiGetMock).not.toHaveBeenCalled();
    expect(tourApiGetMock).toHaveBeenCalled();
  });
});
