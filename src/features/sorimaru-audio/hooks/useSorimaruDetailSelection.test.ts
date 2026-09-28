import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryDetail, SorimaruStorySummary } from '../domain/sorimaruStory';
import { useSorimaruAudioStore } from '../store/useSorimaruAudioStore';
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
  beforeEach(() => {
    useSorimaruAudioStore.setState(useSorimaruAudioStore.getInitialState(), true);
  });

  it('shares a pending deep-link request across a list update so rejection stays visible and retry works', async () => {
    let rejectDetail!: (reason: Error) => void;
    const pendingDetail = new Promise<SorimaruStoryDetail>((_resolve, reject) => { rejectDetail = reject; });
    const failure = new Error('detail unavailable');
    const getStoryDetail = vi.fn().mockReturnValueOnce(pendingDetail).mockResolvedValueOnce(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);
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
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
    expect(useSorimaruAudioStore.getState().detailStatusById['story-1']).toBe('success');
  });

  it('loads one matched detail and selects it with autoplay', async () => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    await selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: true });
    await selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: true });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
    expect(useSorimaruAudioStore.getState().isPlaying).toBe(true);
  });

  it('keeps ordinary entry at zero detail requests', async () => {
    const getStoryDetail = vi.fn();
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    await selection.selectFromIntent([summary], { autoPlay: false });

    expect(getStoryDetail).not.toHaveBeenCalled();
    expect(useSorimaruAudioStore.getState().currentStory).toBeNull();
  });

  it('does not cancel a user selection when an ordinary list refresh has no URL intent', async () => {
    let resolveDetail!: (value: SorimaruStoryDetail) => void;
    const pending = new Promise<SorimaruStoryDetail>((resolve) => { resolveDetail = resolve; });
    const getStoryDetail = vi.fn().mockReturnValue(pending);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    const userSelection = useSorimaruAudioStore.getState().selectAndLoadStory(summary, 'play', repository);
    await selection.selectFromIntent([summary], { autoPlay: false });
    resolveDetail(detail);
    await userSelection;

    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
    expect(useSorimaruAudioStore.getState().isPlaying).toBe(true);
  });

  it('does not cancel a later user selection after an earlier URL detail resolved', async () => {
    const secondSummary = { ...summary, storyId: 'story-2' };
    const secondDetail = { ...detail, storyId: 'story-2' };
    let resolveSecond!: (value: SorimaruStoryDetail) => void;
    const pendingSecond = new Promise<SorimaruStoryDetail>((resolve) => { resolveSecond = resolve; });
    const getStoryDetail = vi.fn().mockResolvedValueOnce(detail).mockReturnValueOnce(pendingSecond);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    await selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: false });
    const userSelection = useSorimaruAudioStore.getState().selectAndLoadStory(secondSummary, 'play', repository);
    await selection.selectFromIntent([summary], { autoPlay: false });
    resolveSecond(secondDetail);
    await userSelection;

    expect(useSorimaruAudioStore.getState().currentStory).toEqual(secondDetail);
  });

  it('lets a newer user selection finish when a pending URL selection is cleared', async () => {
    const secondSummary = { ...summary, storyId: 'story-2' };
    const secondDetail = { ...detail, storyId: 'story-2' };
    let resolveFirst!: (value: SorimaruStoryDetail) => void;
    let resolveSecond!: (value: SorimaruStoryDetail) => void;
    const firstPending = new Promise<SorimaruStoryDetail>((resolve) => { resolveFirst = resolve; });
    const secondPending = new Promise<SorimaruStoryDetail>((resolve) => { resolveSecond = resolve; });
    const getStoryDetail = vi.fn()
      .mockReturnValueOnce(firstPending)
      .mockReturnValueOnce(secondPending);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    const urlSelection = selection.selectFromIntent([summary], { stid: 'story-1', autoPlay: false });
    const userSelection = useSorimaruAudioStore.getState().selectAndLoadStory(secondSummary, 'play', repository);
    await selection.selectFromIntent([summary], { autoPlay: false });
    resolveSecond(secondDetail);
    await userSelection;
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(secondDetail);
    resolveFirst(detail);
    await urlSelection;

    expect(getStoryDetail).toHaveBeenCalledTimes(2);
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(secondDetail);
    expect(useSorimaruAudioStore.getState().isPlaying).toBe(true);
  });

  it('loads an explicit story id even when it is absent from the first page', async () => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    await selection.selectFromIntent([], { stid: 'story-1', autoPlay: false });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
    expect(useSorimaruAudioStore.getState().isPlaying).toBe(false);
  });

  it.each([
    { title: '대청마루' },
    { keyword: '바람 소리' },
    { track: '1' },
  ])('loads one detail for a URL selection resolved from the first page', async (selectionIntent) => {
    const getStoryDetail = vi.fn().mockResolvedValue(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);

    await selection.selectFromIntent([summary], { ...selectionIntent, autoPlay: false });

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
  });

  it('does not repeat a failed detail request until explicit retry', async () => {
    const failure = new Error('detail unavailable');
    const getStoryDetail = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(detail);
    const repository = { listStories: vi.fn(), getStoryDetail, listRegionGroups: vi.fn() } satisfies SorimaruRepository;
    const selection = createSorimaruDetailSelectionController(repository);
    const intent = { stid: 'story-1', autoPlay: false };

    await expect(selection.selectFromIntent([], intent)).rejects.toBe(failure);
    await expect(selection.selectFromIntent([summary], intent)).rejects.toBe(failure);
    expect(getStoryDetail).toHaveBeenCalledTimes(1);

    await selection.selectFromIntent([summary], intent, true);
    expect(getStoryDetail).toHaveBeenCalledTimes(2);
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
  });
});
