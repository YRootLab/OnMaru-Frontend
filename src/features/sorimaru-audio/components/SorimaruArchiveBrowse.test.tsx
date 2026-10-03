// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { SorimaruArchiveBrowse } from './SorimaruArchiveBrowse';

vi.mock('@/features/sorimaru-audio/hooks/useSorimaruImage', () => ({
  useSorimaruImage: () => '/story.jpg',
}));
vi.mock('@/features/sorimaru-audio/store/useSorimaruAudioStore', () => ({
  useSorimaruAudioStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      currentStory: null,
      isPlaying: false,
      selectAndLoadStory: vi.fn(),
      setIsPlaying: vi.fn(),
    }),
}));

const LONG_TITLE = '봄비는 관광지는 이제 그만 나만 알고 싶은 아주 긴 한옥 이야기';

const story: SorimaruStorySummary = {
  storyId: 'archive-1',
  title: LONG_TITLE,
  audioTitle: '봄비와 한옥 처마의 소리',
  category: '오디오 관광',
  region: { regionCode: '26', name: '경북 · 대구', level: 'CITY', parentRegionCode: null },
  coordinates: { lat: 35.87, lng: 128.6 },
  durationSeconds: 178,
  imageUrl: '/story.jpg',
  linkedPlaceId: 'place-1',
  contentTags: ['봄비', '처마', '한옥'],
  savedByMe: false,
};

afterEach(cleanup);

describe('SorimaruArchiveBrowse request states', () => {
  it('shows a retryable server state instead of filter-empty guidance on failure', () => {
    const onRetry = vi.fn();
    render(
      <SorimaruArchiveBrowse
        stories={[]}
        isLoading={false}
        error={new Error('offline')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('잠시 연결이 불안정해요')).toBeTruthy();
    expect(screen.queryByText('조건에 맞는 이야기가 아직 없어요')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps filter-empty guidance after a successful empty response', () => {
    render(<SorimaruArchiveBrowse stories={[]} isLoading={false} />);
    expect(screen.getByText('조건에 맞는 이야기가 아직 없어요')).toBeTruthy();
    expect(screen.queryByText('잠시 연결이 불안정해요')).toBeNull();
  });
});

describe('SorimaruArchiveBrowse typography', () => {
  it('reserves a readable two-line title inside each story card', () => {
    render(<SorimaruArchiveBrowse stories={[story]} isLoading={false} />);

    const title = screen.getByRole('heading', { name: LONG_TITLE });
    expect(getComputedStyle(title).webkitLineClamp).toBe('2');
    expect(getComputedStyle(title).fontSize).toBe('1rem');

    const article = title.closest('article');
    expect(article).not.toBeNull();
    expect(getComputedStyle(article!).minHeight).toBe('6.5rem');
  });

  it('reserves the loaded card height and two title rows in its skeleton', () => {
    render(<SorimaruArchiveBrowse stories={[]} isLoading />);

    const skeletonCard = document.querySelector('[data-skeleton-archive-card]');
    expect(skeletonCard).not.toBeNull();
    expect(getComputedStyle(skeletonCard!).minHeight).toBe('6.5rem');
    expect(skeletonCard?.querySelectorAll('[data-skeleton-title-row]')).toHaveLength(2);
  });
});
