import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

const tourApiGetMock = vi.fn();
vi.mock('@/lib/tour-api/tourApiClient', () => ({
  TourApiClient: { get: (...args: unknown[]) => tourApiGetMock(...args) },
}));

describe('HanokDetailService.getHanokDetail (FE #90)', () => {
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

  it('renders backend place detail when the backend responds successfully', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockResolvedValue({
      placeId: 'p-1',
      name: '전주 한옥마을',
      address: '전북 전주시 완산구 기린대로 99',
      coordinates: { lat: 35.8151, lng: 127.153 },
      images: [{ url: 'https://cdn.onmaru.example/cover.jpg', alt: '' }],
      description: '설명',
      contentTags: ['한옥'],
    });

    const { HanokDetailService } = await import('./hanokDetail.service');
    const result = await HanokDetailService.getHanokDetail('p-1');

    expect(apiGetMock).toHaveBeenCalledWith('/hanoks/p-1');
    expect(result).toMatchObject({
      overview: '설명',
      addr: '전북 전주시 완산구 기린대로 99',
      lat: 35.8151,
      lng: 127.153,
      source: 'backend',
    });
  });

  it('falls back to the TourAPI path when the backend request fails', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    apiGetMock.mockRejectedValue(new Error('not found'));

    const { HanokDetailService } = await import('./hanokDetail.service');
    const result = await HanokDetailService.getHanokDetail('126998');

    expect(apiGetMock).toHaveBeenCalled();
    expect(result.source).toBe('none');
  });

  it('skips the backend entirely when NEXT_PUBLIC_API_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const { HanokDetailService } = await import('./hanokDetail.service');
    await HanokDetailService.getHanokDetail('126998');

    expect(apiGetMock).not.toHaveBeenCalled();
  });
});
