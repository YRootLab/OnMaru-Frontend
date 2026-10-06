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
  searchStoriesByKeyword: vi.fn(),
  listNearbyStories: vi.fn(),
  getRecommendations: vi.fn(),
  getStoryList: vi.fn().mockResolvedValue([]),
};

class NearbyObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  disconnect() {}
}

function renderRail(onSelectStory = vi.fn(), railStories = stories) {
  render(
    <SorimaruDependencyProvider apiService={repository}>
      <SorimaruEditorialRail stories={railStories} onSelectStory={onSelectStory} />
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
  it('renders a full rail of same-footprint skeleton cards during initial loading', () => {
    render(
      <SorimaruEditorialRail
        stories={[]}
        isLoading
        onSelectStory={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('소리마루 추천').getAttribute('aria-busy')).toBe('true');
    expect(screen.getAllByTestId('sorimaru-editorial-skeleton-card')).toHaveLength(5);
    expect(screen.queryByText('한옥 이야기 1')).toBeNull();
  });

  it('replaces only card content with skeletons while refreshing existing positions', () => {
    render(
      <SorimaruEditorialRail
        stories={stories}
        isLoading
        onSelectStory={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('소리마루 추천').getAttribute('aria-busy')).toBe('true');
    expect(screen.getAllByTestId('sorimaru-editorial-skeleton-card')).toHaveLength(5);
    expect(screen.queryByText('한옥 이야기 1')).toBeNull();
  });

  it('shows a retryable server state instead of empty-result guidance on failure', () => {
    const onRetry = vi.fn();
    render(
      <SorimaruEditorialRail
        stories={[]}
        error={new Error('offline')}
        onRetry={onRetry}
        onSelectStory={vi.fn()}
      />,
    );

    expect(screen.getByText('잠시 연결이 불안정해요')).toBeTruthy();
    expect(screen.queryByText('이 주제의 이야기를 찾지 못했어요')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps empty-result guidance after a successful empty response', () => {
    renderRail(vi.fn(), []);
    expect(screen.getByText('이 주제의 이야기를 찾지 못했어요')).toBeTruthy();
    expect(screen.queryByText('잠시 연결이 불안정해요')).toBeNull();
  });

  it('preserves the story badge, specific region subtitle, and Korean duration copy', () => {
    renderRail();
    const activeCard = screen.getByRole('button', { name: '한옥 이야기 1 현재 선택됨' });

    expect(activeCard.querySelector('p')?.textContent).toBe('소리 이야기');
    expect(activeCard.querySelectorAll('p')[1]?.textContent).toBe('서울특별시');
    expect(activeCard.querySelector('span')?.textContent).toContain('3분 00초');
  });

  it('prefers a specific category as the badge over a content tag', () => {
    renderRail(vi.fn(), [{ ...stories[0], category: '궁궐/역사', contentTags: ['한옥'] }]);

    const activeCard = screen.getByRole('button', { name: '한옥 이야기 1 현재 선택됨' });
    expect(activeCard.querySelector('p')?.textContent).toBe('궁궐/역사');
  });

  it('does not let a category code tag replace the backend category badge', () => {
    renderRail(vi.fn(), [{ ...stories[0], contentTags: ['palace'] }]);

    const activeCard = screen.getByRole('button', { name: '한옥 이야기 1 현재 선택됨' });
    expect(activeCard.querySelector('p')?.textContent).toBe('소리 이야기');
  });

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
  }, 15000);

  it('requests playback only when the active card is activated', () => {
    vi.stubGlobal('IntersectionObserver', NearbyObserver);
    const onSelectStory = renderRail();

    fireEvent.click(screen.getByRole('button', { name: '한옥 이야기 2' }));
    expect(onSelectStory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '한옥 이야기 2 현재 선택됨' }));
    expect(onSelectStory).toHaveBeenCalledExactlyOnceWith(stories[1], 'play');
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
  });

  it('moves exactly one story for each previous or next navigation click', () => {
    vi.stubGlobal('IntersectionObserver', NearbyObserver);
    renderRail();

    fireEvent.click(screen.getByRole('button', { name: '다음 이야기' }));
    expect(screen.getByRole('button', { name: '한옥 이야기 2 현재 선택됨' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '다음 이야기' }));
    expect(screen.getByRole('button', { name: '한옥 이야기 3 현재 선택됨' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '이전 이야기' }));
    expect(screen.getByRole('button', { name: '한옥 이야기 2 현재 선택됨' })).toBeTruthy();
  });

  it('pauses autoplay outside the viewport and resumes it when visible again', () => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', NearbyObserver);
    const view = render(
      <SorimaruEditorialRail stories={stories} isActive={false} onSelectStory={vi.fn()} />,
    );

    act(() => { vi.advanceTimersByTime(14000); });
    expect(screen.getByRole('button', { name: '한옥 이야기 1 현재 선택됨' })).toBeTruthy();

    view.rerender(
      <SorimaruEditorialRail stories={stories} isActive onSelectStory={vi.fn()} />,
    );
    act(() => { vi.advanceTimersByTime(7000); });
    expect(screen.getByRole('button', { name: '한옥 이야기 2 현재 선택됨' })).toBeTruthy();
  });
});
