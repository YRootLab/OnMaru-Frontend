import { describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryDetail, SorimaruStorySummary } from '../domain/sorimaruStory';
import { createSorimaruDetailSelectionController } from './useSorimaruDetailSelection';

const summary: SorimaruStorySummary = {
  storyId: 'story-1', title: '대청마루 이야기', audioTitle: '바람 소리', category: '한옥',
  region: { regionCode: 'kr-11', name: '서울', level: 'PROVINCE', parentRegionCode: null },
  coordinates: { lat: 37.5, lng: 127 }, durationSeconds: 180,
  imageUrl: 'https://example.com/image.jpg', linkedPlaceId: 'place-1',
  contentTags: ['한옥'], savedByMe: false,
};
const detail: SorimaruStoryDetail = {
  ...summary, audioUrl: 'https://example.com/audio.mp3',
  transcript: [{ text: '첫 문장', startTimeSeconds: 0 }, { text: '둘째 문장', startTimeSeconds: 10 }],
};

describe('Sorimaru deep-link detail selection', () => {
  it('shares a pending deep-link request across a list update so rejection stays visible and retry works', async () => {
    let rejectDetail!: (reason: Error) => void;
    const pendingDetail = new Promise<SorimaruStoryDetail>((_resolve, reject) => { rejectDetail = reject; });
    const failure = new Error('detail unavailable');
    const getStoryDetail = vi.fn().mockReturnValueOnce(pendingDetail).mockResolvedValueOnce(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);
    const intent = { stid: 'story-1', autoPlay: false };
    let visibleSelectionError: Error | null = null;

    const first = selection.selectFromIntent([], intent);
    let firstEffectActive = true;
    void first.catch((reason: Error) => { if (firstEffectActive) visibleSelectionError = reason; });

    firstEffectActive = false;
    const afterListUpdate = selection.selectFromIntent([summary], intent);
    expect(afterListUpdate).toBe(first);
    void afterListUpdate.catch((reason: Error) => { visibleSelectionError = reason; });

    rejectDetail(failure);
    await expect(first).rejects.toBe(failure);
    await expect(afterListUpdate).rejects.toBe(failure);
    expect(visibleSelectionError).toBe(failure);
    expect(getStoryDetail).toHaveBeenCalledTimes(1);

    await selection.selectFromIntent([summary], intent, true);
    expect(getStoryDetail).toHaveBeenCalledTimes(2);
    expect(player.selectStory).toHaveBeenCalledOnce();
  });

  it('loads one matched detail and selects it with autoplay', async () => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);

    await selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: true });
    await selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: true });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(player.selectStory).toHaveBeenCalledOnce();
    expect(player.selectStory).toHaveBeenCalledWith(expect.objectContaining({
      stid: 'story-1', audioUrl: detail.audioUrl, playTime: '180', script: '첫 문장\n둘째 문장',
    }));
    expect(player.setIsPlaying).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('keeps ordinary entry at zero detail requests', async () => {
    const getStoryDetail = vi.fn();
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);

    await selection.selectFromIntent([summary], { autoPlay: false });

    expect(getStoryDetail).not.toHaveBeenCalled();
    expect(player.selectStory).not.toHaveBeenCalled();
  });

  it('loads an explicit story id even when it is absent from the first page', async () => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);

    await selection.selectFromIntent([], { stid: 'story-1', autoPlay: false });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(player.selectStory).toHaveBeenCalledOnce();
    expect(player.setIsPlaying).not.toHaveBeenCalled();
  });

  it.each([
    { title: '대청마루' },
    { keyword: '바람 소리' },
    { track: '1' },
  ])('loads one detail for a URL selection resolved from the first page', async (selectionIntent) => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);

    await selection.selectFromIntent([summary], { ...selectionIntent, autoPlay: false });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(player.selectStory).toHaveBeenCalledOnce();
  });

  it('does not repeat a failed detail request until explicit retry', async () => {
    const failure = new Error('detail unavailable');
    const getStoryDetail = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const player = { selectStory: vi.fn(), setIsPlaying: vi.fn() };
    const selection = createSorimaruDetailSelectionController(repository, player);
    const intent = { stid: 'story-1', autoPlay: false };

    await expect(selection.selectFromIntent([], intent)).rejects.toBe(failure);
    await expect(selection.selectFromIntent([summary], intent)).rejects.toBe(failure);
    expect(getStoryDetail).toHaveBeenCalledTimes(1);

    await selection.selectFromIntent([summary], intent, true);
    expect(getStoryDetail).toHaveBeenCalledTimes(2);
    expect(player.selectStory).toHaveBeenCalledOnce();
  });
});
