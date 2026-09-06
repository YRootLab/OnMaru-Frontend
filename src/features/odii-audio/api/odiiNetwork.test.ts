import { describe, expect, it, vi } from 'vitest';
import { createOdiiNetworkClient } from './odiiNetwork';

describe('createOdiiNetworkClient', () => {
  it('uses injected endpoint and response decoder', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ records: [{ id: 'future-shape' }] }),
    });
    const decodeResponse = vi.fn().mockReturnValue({
      items: [{ stid: 'future-shape' }],
      totalCount: 1,
    });
    const client = createOdiiNetworkClient({
      resolveEndpoint: () => '/future/odii',
      decodeResponse,
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(client.request({ type: 'stories', params: {} })).resolves.toEqual({
      items: [{ stid: 'future-shape' }],
      totalCount: 1,
    });
    expect(fetcher).toHaveBeenCalledWith('/future/odii', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
    expect(decodeResponse).toHaveBeenCalledWith(
      { records: [{ id: 'future-shape' }] },
      { type: 'stories', params: {} },
    );
  });

  it('decodes the current TourAPI envelope by default', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        response: { body: { items: { item: { stid: 'one' } }, totalCount: '4' } },
      }),
    });
    const client = createOdiiNetworkClient({ fetcher: fetcher as unknown as typeof fetch });

    await expect(client.request({ type: 'stories', params: { pageNo: '1' } })).resolves.toEqual({
      items: [{ stid: 'one' }],
      totalCount: 4,
    });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/odii?type=stories&pageNo=1',
      expect.any(Object),
    );
  });
});
