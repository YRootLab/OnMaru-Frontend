import { describe, expect, it, vi } from 'vitest';
import { createSorimaruHttpRepository, createSorimaruRuntimeRepository } from './sorimaruHttpRepository';

const summary = (index: number) => ({
  storyId: `story-${index}`,
  title: `Story ${index}`,
  audioTitle: `Audio ${index}`,
  category: 'HISTORIC',
  region: { regionCode: '11', name: '서울', level: 'SIDO', parentRegionCode: null },
  coordinates: { lat: 37.5, lng: 127 },
  durationSeconds: 180,
  imageUrl: null,
  linkedPlaceId: null,
  contentTags: ['palace'],
  savedByMe: false,
});

const detailPayload = {
  story: summary(1),
  audioUrl: 'https://example.com/audio.mp3',
  transcript: [{ text: 'Welcome', startTimeSeconds: 0 }],
};

describe('Sorimaru HTTP repository', () => {
  it('lists 12 summaries with one backend request and no detail requests', async () => {
    const request = vi.fn().mockResolvedValue({
      items: Array.from({ length: 12 }, (_, index) => summary(index + 1)),
      totalCount: 24,
      nextCursor: 'next',
      hasMore: true,
    });
    const repository = createSorimaruHttpRepository(request);

    const page = await repository.listStories({ language: 'ko-KR', limit: 12 });

    expect(page.items).toHaveLength(12);
    expect(page.totalCount).toBe(24);
    expect(page.nextCursor).toBe('next');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('odii/stories', {
      language: 'ko-KR', limit: 12, category: undefined, regionCode: undefined, cursor: undefined,
    });
  });

  it('uses the returned cursor in exactly one next-page request', async () => {
    const request = vi.fn().mockResolvedValue({ items: [summary(13)], totalCount: 13, nextCursor: null, hasMore: false });
    const repository = createSorimaruHttpRepository(request);

    await repository.listStories({ language: 'ko-KR', limit: 12, cursor: 'cursor-2' });

    expect(request).toHaveBeenCalledWith('odii/stories', {
      language: 'ko-KR', limit: 12, category: undefined, regionCode: undefined, cursor: 'cursor-2',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('requests one encoded detail and maps its nested story', async () => {
    const request = vi.fn().mockResolvedValue(detailPayload);
    const repository = createSorimaruHttpRepository(request);

    const detail = await repository.getStoryDetail('story/1', 'en-US');

    expect(detail).toMatchObject({ storyId: 'story-1', audioUrl: detailPayload.audioUrl });
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith('odii/stories/story%2F1', { language: 'en-US' });
  });

  it('dedupes concurrent detail reads and caches the success', async () => {
    let resolveRequest!: (value: typeof detailPayload) => void;
    const pending = new Promise<typeof detailPayload>((resolve) => { resolveRequest = resolve; });
    const request = vi.fn().mockReturnValue(pending);
    const repository = createSorimaruHttpRepository(request);

    const reads = Promise.all([repository.getStoryDetail('story-1'), repository.getStoryDetail('story-1')]);
    resolveRequest(detailPayload);
    const [first, second] = await reads;
    await repository.getStoryDetail('story-1');

    expect(first).toEqual(second);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('propagates a list failure instead of returning an empty page and allows retry', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValueOnce({ items: [summary(1)], totalCount: 1, nextCursor: null, hasMore: false });
    const repository = createSorimaruHttpRepository(request);
    const query = { language: 'ko-KR', limit: 12 };

    await expect(repository.listStories(query)).rejects.toThrow('backend unavailable');
    await expect(repository.listStories(query)).resolves.toMatchObject({ items: [{ storyId: 'story-1' }] });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not cache malformed responses', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ items: [{ storyId: 'partial' }], totalCount: 1, nextCursor: null, hasMore: false })
      .mockResolvedValueOnce({ items: [summary(1)], totalCount: 1, nextCursor: null, hasMore: false });
    const repository = createSorimaruHttpRepository(request);
    const query = { language: 'ko-KR', limit: 12 };

    await expect(repository.listStories(query)).rejects.toThrow('Invalid Sorimaru story page');
    await expect(repository.listStories(query)).resolves.toMatchObject({ items: [{ storyId: 'story-1' }] });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('force refresh skips a cached success but joins an in-flight request', async () => {
    const request = vi.fn().mockResolvedValue({ items: [summary(1)], totalCount: 1, nextCursor: null, hasMore: false });
    const repository = createSorimaruHttpRepository(request);
    const query = { language: 'ko-KR', limit: 12 };

    await repository.listStories(query);
    await Promise.all([
      repository.listStories(query, { force: true }),
      repository.listStories(query, { force: true }),
    ]);

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('loads and validates region groups through one backend request', async () => {
    const request = vi.fn().mockResolvedValue({ groups: [{ label: '수도권', regionCodes: ['11'], storyCount: 12 }] });
    const repository = createSorimaruHttpRepository(request);

    await expect(repository.listRegionGroups('ko-KR')).resolves.toEqual({
      groups: [{ label: '수도권', regionCodes: ['11'], storyCount: 12 }],
    });
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith('odii/regions', { language: 'ko-KR' });
  });

  it('does not share user-specific summary successes between server calls', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ items: [{ ...summary(1), savedByMe: false }], totalCount: 1, nextCursor: null, hasMore: false })
      .mockResolvedValueOnce({ items: [{ ...summary(1), savedByMe: true }], totalCount: 1, nextCursor: null, hasMore: false });
    const repository = createSorimaruRuntimeRepository(request, () => false);
    const query = { language: 'ko-KR', limit: 12 };

    expect((await repository.listStories(query)).items[0].savedByMe).toBe(false);
    expect((await repository.listStories(query)).items[0].savedByMe).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('shares successful list reads within a browser tab', async () => {
    const request = vi.fn().mockResolvedValue({ items: [summary(1)], totalCount: 1, nextCursor: null, hasMore: false });
    const repository = createSorimaruRuntimeRepository(request, () => true);
    const query = { language: 'ko-KR', limit: 12 };

    await repository.listStories(query);
    await repository.listStories(query);

    expect(request).toHaveBeenCalledTimes(1);
  });
});
