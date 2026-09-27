import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sorimaruApiAdapter } from '../api/sorimaruApi';
import type { SorimaruStoryDetail, SorimaruStorySummary } from '../domain/sorimaruStory';
import { useSorimaruAudioStore } from './useSorimaruAudioStore';

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

describe('Sorimaru detail selection', () => {
  beforeEach(() => {
    useSorimaruAudioStore.setState(useSorimaruAudioStore.getInitialState(), true);
    vi.restoreAllMocks();
  });

  it('does not request detail for an ordinary initial list', () => {
    const getStoryDetail = vi.spyOn(sorimaruApiAdapter, 'getStoryDetail');
    useSorimaruAudioStore.getState().setAvailableStories([summary]);

    expect(getStoryDetail).not.toHaveBeenCalled();
    expect(useSorimaruAudioStore.getState().currentStory).toBeNull();
  });

  it('loads only the selected detail once and reuses it on reselection', async () => {
    const getStoryDetail = vi.spyOn(sorimaruApiAdapter, 'getStoryDetail').mockResolvedValue(detail);

    await useSorimaruAudioStore.getState().selectAndLoadStory(summary, 'play');
    await useSorimaruAudioStore.getState().selectAndLoadStory(summary, 'play');

    expect(getStoryDetail).toHaveBeenCalledExactlyOnceWith('story-1', 'ko-KR');
    expect(useSorimaruAudioStore.getState()).toMatchObject({
      currentStory: detail,
      isPlaying: true,
      duration: 180,
      parsedScriptLines: [
        { id: 1, timeSec: 0, text: '첫 문장' },
        { id: 2, timeSec: 10, text: '둘째 문장' },
      ],
      detailStatusById: { 'story-1': 'success' },
    });
  });

  it('spreads untimed transcript sentences across the detail duration', async () => {
    const untimedDetail: SorimaruStoryDetail = {
      ...detail,
      durationSeconds: 120,
      transcript: [{ text: '첫 문장. 둘째 문장.' }, { text: '셋째 문장.' }],
    };
    vi.spyOn(sorimaruApiAdapter, 'getStoryDetail').mockResolvedValue(untimedDetail);

    await useSorimaruAudioStore.getState().selectAndLoadStory(summary);

    expect(useSorimaruAudioStore.getState().parsedScriptLines).toEqual([
      { id: 1, timeSec: 0, text: '첫 문장.' },
      { id: 2, timeSec: 40, text: '둘째 문장.' },
      { id: 3, timeSec: 80, text: '셋째 문장.' },
    ]);
    useSorimaruAudioStore.getState().setCurrentTime(39);
    expect(useSorimaruAudioStore.getState().activeScriptIndex).toBe(0);
    useSorimaruAudioStore.getState().setCurrentTime(80);
    expect(useSorimaruAudioStore.getState().activeScriptIndex).toBe(2);
  });

  it('keeps summaries and the previous detail when a new detail fails', async () => {
    const secondSummary = { ...summary, storyId: 'story-2', title: '다른 이야기' };
    const failure = new Error('detail failed');
    vi.spyOn(sorimaruApiAdapter, 'getStoryDetail').mockRejectedValue(failure);
    useSorimaruAudioStore.setState({ availableStories: [summary, secondSummary], currentStory: detail });

    await expect(useSorimaruAudioStore.getState().selectAndLoadStory(secondSummary, 'play')).rejects.toBe(failure);

    expect(useSorimaruAudioStore.getState()).toMatchObject({
      availableStories: [summary, secondSummary],
      currentStory: detail,
      detailStatusById: { 'story-2': 'error' },
      detailErrorById: { 'story-2': failure },
    });
  });

  it('shares an in-flight detail request across repeated selections', async () => {
    let resolveDetail!: (value: SorimaruStoryDetail) => void;
    const pending = new Promise<SorimaruStoryDetail>((resolve) => { resolveDetail = resolve; });
    const getStoryDetail = vi.spyOn(sorimaruApiAdapter, 'getStoryDetail').mockReturnValue(pending);

    const first = useSorimaruAudioStore.getState().selectAndLoadStory(summary, 'select');
    const second = useSorimaruAudioStore.getState().selectAndLoadStory(summary, 'play');
    expect(getStoryDetail).toHaveBeenCalledTimes(1);
    expect(useSorimaruAudioStore.getState().detailStatusById['story-1']).toBe('loading');

    resolveDetail(detail);
    await Promise.all([first, second]);
    expect(useSorimaruAudioStore.getState().currentStory).toEqual(detail);
    expect(useSorimaruAudioStore.getState().isPlaying).toBe(true);
  });
});
