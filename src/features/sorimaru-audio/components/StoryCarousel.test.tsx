// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { StoryCarousel, StoryCarouselSkeleton } from './StoryCarousel';

vi.mock('@gsap/react', () => ({ useGSAP: () => undefined }));
vi.mock('gsap', () => ({ default: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
vi.mock('@/features/sorimaru-audio/hooks/useSorimaruImage', () => ({
  useSorimaruImage: () => '/story.jpg',
  getSorimaruFallbackImage: () => '/fallback.jpg',
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

const LONG_TITLE = '모든 계절과 골목의 이야기를 천천히 따라 걷는 아주 긴 오디오 제목';

const story: SorimaruStorySummary = {
  storyId: 'nearby-1',
  title: LONG_TITLE,
  audioTitle: '한옥에서 만나는 바람과 사람의 이야기',
  category: '오디오 관광',
  region: { regionCode: '11', name: '서울 종로', level: 'CITY', parentRegionCode: null },
  coordinates: { lat: 37.57, lng: 126.98 },
  durationSeconds: 164,
  imageUrl: '/story.jpg',
  linkedPlaceId: 'place-1',
  contentTags: ['한옥', '골목'],
  savedByMe: false,
};

beforeAll(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(cleanup);

describe('StoryCarousel typography', () => {
  it('reserves a readable two-line title inside the nearby card', () => {
    render(<StoryCarousel stories={[story]} />);

    const title = screen.getByRole('heading', { name: LONG_TITLE });
    expect(getComputedStyle(title).webkitLineClamp).toBe('2');
    expect(getComputedStyle(title).fontSize).toBe('1rem');

    const card = title.closest('[data-story-card]');
    expect(card).not.toBeNull();
    expect(getComputedStyle(card!).minHeight).toBe('11rem');
  });

  it('reserves the loaded card height and two title rows in its skeleton', () => {
    render(<StoryCarouselSkeleton />);

    const skeletonCard = document.querySelector('[data-skeleton-story-card]');
    expect(skeletonCard).not.toBeNull();
    expect(getComputedStyle(skeletonCard!).minHeight).toBe('11rem');
    expect(skeletonCard?.querySelectorAll('[data-skeleton-title-row]')).toHaveLength(2);
  });
});
