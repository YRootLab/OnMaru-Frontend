import { describe, expect, it, vi, beforeEach } from 'vitest';

const apiGetMock = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

describe('HanokArchiveService', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it('fetches hanoks from backend API only', async () => {
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
      ],
    });

    const { HanokArchiveService } = await import('./hanokArchive.service');
    const result = await HanokArchiveService.fetchHanoks();

    expect(apiGetMock).toHaveBeenCalledWith('/hanoks', { limit: 50 });
    expect(result).toHaveLength(1);
  });
});
