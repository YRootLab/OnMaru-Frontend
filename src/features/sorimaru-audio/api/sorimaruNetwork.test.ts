import { describe, expect, it, vi } from 'vitest';
import { createSorimaruNetworkClient } from './sorimaruNetwork';

describe('createSorimaruNetworkClient', () => {
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
    const client = createSorimaruNetworkClient({
      resolveEndpoint: () => '/future/sorimaru',
      decodeResponse,
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(client.request({ type: 'stories', params: {} })).resolves.toEqual({
      items: [{ stid: 'future-shape' }],
      totalCount: 1,
    });
    expect(fetcher).toHaveBeenCalledWith('/future/sorimaru', {
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
    const client = createSorimaruNetworkClient({ fetcher: fetcher as unknown as typeof fetch });

    await expect(client.request({ type: 'stories', params: { pageNo: '1' } })).resolves.toEqual({
      items: [{ stid: 'one' }],
      totalCount: 4,
      source: 'public',
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/B551011/Odii/storyBasedList?'),
      expect.any(Object),
    );
  });

  it('uses the OnMaru backend and merges each story detail before rendering', async () => {
    const fetcher = vi.fn();
    const backendRequester = vi.fn()
      .mockResolvedValueOnce({
        items: [{
          storyId: 'story-1',
          title: '경복궁 이야기',
          audioTitle: '근정전의 아침',
          category: 'HISTORIC',
          coordinates: { lat: 37.5796, lng: 126.977 },
          durationSeconds: 180,
          imageUrl: 'https://example.com/story.jpg',
          contentTags: ['궁궐'],
        }],
      })
      .mockResolvedValueOnce({
        audioUrl: 'https://example.com/story.mp3',
        transcript: [{ text: '첫 번째 대본' }, { text: '두 번째 대본' }],
      });
    const client = createSorimaruNetworkClient({
      backendRequester,
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(client.request({ type: 'stories', params: { numOfRows: '7' } })).resolves.toEqual({
      items: [{
        tid: 'story-1',
        stid: 'story-1',
        title: '경복궁 이야기',
        audioTitle: '근정전의 아침',
        audioUrl: 'https://example.com/story.mp3',
        playTime: '180',
        imageUrl: 'https://example.com/story.jpg',
        mapX: '126.977',
        mapY: '37.5796',
        script: '첫 번째 대본\n두 번째 대본',
        themaCategory: 'HISTORIC',
        tags: ['궁궐'],
        addr1: '',
      }],
      totalCount: 1,
      source: 'backend',
    });
    expect(backendRequester).toHaveBeenNthCalledWith(1, 'odii/stories', {
      language: 'ko-KR',
      limit: '7',
    });
    expect(backendRequester).toHaveBeenNthCalledWith(2, 'odii/stories/story-1', { language: 'ko-KR' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('falls back to the public API when the OnMaru backend request fails', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        response: { body: { items: { item: { stid: 'public-story' } }, totalCount: '1' } },
      }),
    });
    const client = createSorimaruNetworkClient({
      backendRequester: vi.fn().mockRejectedValue(new Error('backend unavailable')),
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(client.request({ type: 'stories', params: {} })).resolves.toMatchObject({
      items: [{ stid: 'public-story' }],
      totalCount: 1,
      source: 'public',
    });
    expect(fetcher).toHaveBeenCalled();
  });
});
