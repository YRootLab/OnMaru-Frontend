// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { SorimaruDependencyProvider } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { SorimaruEditorialRail } from './SorimaruEditorialRail';

vi.mock('gsap', () => ({
  default: {
    set: vi.fn(),
    to: vi.fn((_element, options: { onComplete?: () => void }) => {
      options.onComplete?.();
      return { kill: vi.fn() };
    }),
  },
}));

const stories: SorimaruStorySummary[] = Array.from({ length: 17 }, (_, index) => ({
  storyId: `story-${index + 1}`,
  title: `한옥 이야기 ${index + 1}`,
  audioTitle: `한옥 이야기 ${index + 1}`,
  category: '소리 이야기',
  region: { regionCode: 'kr-11', name: '서울특별시', level: 'PROVINCE', parentRegionCode: null },
  coordinates: null,
  durationSeconds: 180,
  imageUrl: null,
  linkedPlaceId: null,
  contentTags: ['한옥'],
  savedByMe: false,
}));

const repository: SorimaruRepository & { getStoryList: ReturnType<typeof vi.fn> } = {
  listStories: vi.fn(),
  getStoryDetail: vi.fn(),
  listRegionGroups: vi.fn(),
  getStoryList: vi.fn().mockResolvedValue([]),
};

class NearbyObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  disconnect() {}
}

function renderRail(onSelectStory = vi.fn()) {
  render(
    <SorimaruDependencyProvider apiService={repository}>
      <SorimaruEditorialRail stories={stories} onSelectStory={onSelectStory} />
    </SorimaruDependencyProvider>,
  );
  return onSelectStory;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Sorimaru editorial rail', () => {
  it('keeps all 17 supplied summaries in the loop without requesting stories during autoplay or wrap', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', NearbyObserver);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => callback(0));
    const onSelectStory = renderRail();

    await act(async () => { await Promise.resolve(); });
    for (let step = 1; step <= 20; step += 1) {
      act(() => { vi.advanceTimersByTime(7000); });
      expect(screen.getByRole('button', { name: `한옥 이야기 ${(step % 17) + 1} 현재 선택됨` })).toBeTruthy();
    }

    for (let step = 1; step <= 17; step += 1) {
      const nextIndex = ((20 + step) % 17) + 1;
      fireEvent.click(screen.getByRole('button', { name: `한옥 이야기 ${nextIndex}` }));
      expect(screen.getByRole('button', { name: `한옥 이야기 ${nextIndex} 현재 선택됨` })).toBeTruthy();
    }

    const marketTab = screen.getByRole('button', { name: '#전통시장' });
    fireEvent.pointerEnter(marketTab);
    fireEvent.focus(marketTab);
    fireEvent.click(marketTab);

    const storyIds = new Set(stories.map((story) => story.storyId));
    const renderedIds = screen.getAllByTestId('sorimaru-editorial-card').map((card) => card.dataset.storyId);
    expect(renderedIds.every((storyId) => storyId !== undefined && storyIds.has(storyId))).toBe(true);
    expect(repository.listStories).not.toHaveBeenCalled();
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
    expect(repository.getStoryList).not.toHaveBeenCalled();
    expect(onSelectStory).not.toHaveBeenCalled();
  });

  it('requests playback only when the active card is activated', () => {
    vi.stubGlobal('IntersectionObserver', NearbyObserver);
    const onSelectStory = renderRail();

    fireEvent.click(screen.getByRole('button', { name: '한옥 이야기 2' }));
    expect(onSelectStory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '한옥 이야기 2 현재 선택됨' }));
    expect(onSelectStory).toHaveBeenCalledExactlyOnceWith(stories[1], 'play');
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
  });
});
