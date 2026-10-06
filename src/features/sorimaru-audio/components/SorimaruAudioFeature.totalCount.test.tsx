// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryPage } from '../domain/sorimaruStory';
import { useSorimaruAudioStore } from '../store/useSorimaruAudioStore';
import { SorimaruAudioFeature } from './SorimaruAudioFeature';

const archiveBrowseProps = vi.hoisted(() => vi.fn());
const editorialRailProps = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/shared/hooks/useViewportActivation', () => ({
  useViewportActivation: () => ({ ref: vi.fn(), isActive: false }),
}));

vi.mock('./StoryCarousel', () => ({ StoryCarousel: () => null }));
vi.mock('./SorimaruArchiveBrowse', () => ({
  SorimaruArchiveBrowse: (props: { isLoading: boolean }) => {
    archiveBrowseProps(props);
    return <div data-testid="archive-loading-state">{props.isLoading ? 'loading' : 'loaded'}</div>;
  },
}));
vi.mock('./SavedSoundDrawer', () => ({ SavedSoundDrawer: () => null }));
vi.mock('./SorimaruAtmosphereBackground', () => ({ SorimaruAtmosphereBackground: () => null }));
vi.mock('@/private/core-ui/sorimaru/SorimaruAutoSliceRail', () => ({ SorimaruAutoSliceRail: () => null }));
vi.mock('@/private/core-ui/sorimaru/SorimaruEditorialRail', () => ({
  SorimaruEditorialRail: (props: { stories: SorimaruStoryPage['items']; isActive?: boolean }) => {
    editorialRailProps(props);
    return null;
  },
}));
vi.mock('@/private/core-ui/sorimaru/SoundConstellationSection', () => ({ SoundConstellationSection: () => null }));
vi.mock('@/private/core-ui/sorimaru/LocalMiniPlayer', () => ({ LocalMiniPlayer: () => null }));
vi.mock('@/shared/components/animation/VesselReveal', () => ({
  VesselReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  useSorimaruAudioStore.setState({ selectedCategory: '전체', searchQuery: '' });
});

afterEach(cleanup);

const initialPage: SorimaruStoryPage = {
  items: [{
    storyId: 'story-1',
    title: '첫 이야기',
    audioTitle: '첫 이야기',
    category: '한옥',
    region: { regionCode: 'kr-11', name: '서울', level: 'PROVINCE', parentRegionCode: null },
    coordinates: null,
    durationSeconds: 180,
    imageUrl: null,
    linkedPlaceId: null,
    contentTags: [],
    savedByMe: false,
  }],
  totalCount: 23675,
  nextCursor: 'cursor-2',
  hasMore: true,
};

const repository = (pages: SorimaruStoryPage[] = []): SorimaruRepository => ({
  listStories: vi.fn()
    .mockImplementationOnce(async () => pages[0])
    .mockImplementationOnce(async () => pages[1]),
  getStoryDetail: vi.fn(),
  listRegionGroups: vi.fn().mockResolvedValue({
    groups: [{ label: '경주', regionCodes: ['kr-47-130'], storyCount: 87 }],
  }),
  searchStoriesByKeyword: vi.fn(),
  listNearbyStories: vi.fn(),
  getRecommendations: vi.fn(),
});

describe('SorimaruAudioFeature archive count', () => {
  it('replaces the current archive cards with skeletons while the next page is loading', async () => {
    let resolveNextPage!: (page: SorimaruStoryPage) => void;
    const nextPagePromise = new Promise<SorimaruStoryPage>((resolve) => {
      resolveNextPage = resolve;
    });
    const api = repository();
    vi.mocked(api.listStories).mockReset().mockReturnValue(nextPagePromise);

    render(<SorimaruAudioFeature apiService={api} initialPage={initialPage} />);
    expect((await screen.findByTestId('archive-loading-state')).textContent).toBe('loaded');

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(screen.getByTestId('archive-loading-state').textContent).toBe('loading');

    await act(async () => {
      resolveNextPage({ ...initialPage, items: [{ ...initialPage.items[0], storyId: 'story-2' }], nextCursor: null, hasMore: false });
      await nextPagePromise;
    });

    expect(screen.getByTestId('archive-loading-state').textContent).toBe('loaded');
  });

  it('keeps the editorial rail on its initial recommendations when archive pages are appended', async () => {
    const nextPage: SorimaruStoryPage = {
      ...initialPage,
      items: [{ ...initialPage.items[0], storyId: 'story-2', title: '두 번째 페이지 이야기' }],
      nextCursor: null,
      hasMore: false,
    };
    const api = repository([nextPage]);

    render(<SorimaruAudioFeature apiService={api} initialPage={initialPage} />);
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await screen.findByText('2 / 1184');

    const latestProps = editorialRailProps.mock.calls.at(-1)?.[0];
    expect(latestProps.stories.map((story: SorimaruStoryPage['items'][number]) => story.storyId)).toEqual(['story-1']);
  });

  it('shows the filtered backend total instead of the current page length', async () => {
    render(<SorimaruAudioFeature apiService={repository()} initialPage={initialPage} />);

    expect(await screen.findByText('23,675개')).toBeTruthy();
    expect(screen.getByText('1 / 1184')).toBeTruthy();
    expect(screen.queryByText('1개')).toBeNull();
  });

  it.each([
    ['한옥과 고택', 'HANOK_HERITAGE'],
    ['전통 시장', 'TRADITIONAL_MARKET'],
    ['마을과 골목', 'VILLAGE_STREETS'],
    ['궁궐과 역사', 'PALACE_HISTORY'],
    ['소리와 문화', 'SOUND_CULTURE'],
    ['자연과 숲길', 'NATURE_TRAILS'],
  ])('requests %s with the fixed backend code %s', async (label, category) => {
    const api = repository([{ ...initialPage, totalCount: 42 }]);
    render(<SorimaruAudioFeature apiService={api} initialPage={initialPage} />);

    expect(await screen.findByText('23,675개')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: label }));

    await waitFor(() => expect(api.listStories).toHaveBeenCalledWith({
      language: 'ko-KR', limit: 20, category,
    }));
    expect(await screen.findByText('42개')).toBeTruthy();
  });

  it('does not render region chips in the theme tab list', async () => {
    render(<SorimaruAudioFeature apiService={repository()} initialPage={initialPage} />);

    expect(await screen.findByText('23,675개')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '경주' })).toBeNull();
  });

  it('shows the filtered current-page count while a keyword search is active', async () => {
    render(<SorimaruAudioFeature apiService={repository()} initialPage={initialPage} />);
    expect(await screen.findByText('23,675개')).toBeTruthy();

    act(() => useSorimaruAudioStore.getState().setSearchQuery('첫'));

    expect(await screen.findByText('1개')).toBeTruthy();
    expect(screen.queryByText('23,675개')).toBeNull();
  });
});
