// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';
import type { SorimaruStoryPage } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { useSorimaruRegionStories } from '@/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories';
import type { SoundConstellationSectionProps } from './SoundConstellationSection';
import { SoundConstellationSection } from './SoundConstellationSection';

class Observer { observe() {} unobserve() {} disconnect() {} }

const props = (): SoundConstellationSectionProps => ({
  groupsState: { status: 'success', data: { groups: [{ label: '서울·경기·인천', regionCodes: ['returned-code'], storyCount: 25 }] }, error: null },
  regionStoriesState: {
    status: 'success', items: [{
      storyId: 'region-story', title: '궁궐 이야기', audioTitle: '서울의 궁궐', category: '궁궐',
      region: { regionCode: 'returned-code', name: '서울', level: 'PROVINCE', parentRegionCode: null },
      coordinates: null, durationSeconds: 185, imageUrl: null, linkedPlaceId: null, contentTags: [], savedByMe: false,
    }], hasMore: false, loadingNext: false, error: null,
  },
  selectedRegionId: 'seoul', onSelectRegion: vi.fn(), onLoadMore: vi.fn(), onSelectStory: vi.fn(), onRetry: vi.fn(),
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function scrollContainer(container: HTMLElement) {
  const element = [...container.querySelectorAll('aside div')].find((item) => getComputedStyle(item).overflowY === 'auto');
  if (!element) throw new Error('Region scroll container missing');
  return element;
}

function RegionSection({ repository }: { repository: SorimaruRepository }) {
  const region = useSorimaruRegionStories(repository, true);
  return <SoundConstellationSection {...props()} {...region} onSelectRegion={region.selectRegion} onLoadMore={region.loadNextRegionPage} />;
}

describe('SoundConstellationSection props data flow', () => {
  it('renders supplied summaries and backend counts, delegates selection, and makes no network calls', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const input = props();
    render(<SoundConstellationSection {...input} />);
    expect(screen.getByText('25개 이야기')).toBeTruthy();
    expect(screen.getByText('3:05')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /궁궐 이야기/ }));
    expect(input.onSelectStory).toHaveBeenCalledWith(input.regionStoriesState.items[0]);
    fireEvent.click(screen.getByRole('button', { name: /강원/ }));
    expect(input.onSelectRegion).toHaveBeenCalledWith('gangwon');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not turn unknown group counts into zero on failure and delegates retry without new error copy', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    const input = props();
    input.groupsState = { status: 'error', data: null, error: new Error('offline') };
    input.regionStoriesState = { status: 'idle', items: [], hasMore: false, loadingNext: false, error: null };
    render(<SoundConstellationSection {...input} />);
    expect(screen.queryByText('0개 이야기')).toBeNull();
    expect(screen.getByRole('button', { name: /서울/ }).textContent).not.toContain('0');
    fireEvent.click(screen.getByRole('button', { name: /서울/ }));
    expect(input.onRetry).toHaveBeenCalledOnce();
  });

  it('waits for a downward wheel gesture on a short page and coalesces duplicate events until loading finishes', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    const input = props();
    input.regionStoriesState.hasMore = true;
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
    const { container, rerender } = render(<SoundConstellationSection {...input} />);
    const scroll = scrollContainer(container);
    expect(input.onLoadMore).not.toHaveBeenCalled();
    fireEvent.wheel(scroll, { deltaY: -100 });
    expect(input.onLoadMore).not.toHaveBeenCalled();
    fireEvent.wheel(scroll, { deltaY: 100 });
    expect(input.onLoadMore).toHaveBeenCalledOnce();
    fireEvent.wheel(scroll, { deltaY: 100 });
    fireEvent.scroll(scroll);
    expect(input.onLoadMore).toHaveBeenCalledOnce();
    rerender(<SoundConstellationSection {...input} regionStoriesState={{ ...input.regionStoriesState, loadingNext: true }} />);
    fireEvent.wheel(scroll, { deltaY: 100 });
    expect(input.onLoadMore).toHaveBeenCalledOnce();
    rerender(<SoundConstellationSection {...input} regionStoriesState={{ ...input.regionStoriesState, items: [...input.regionStoriesState.items] }} />);
    expect(input.onLoadMore).toHaveBeenCalledOnce();
    fireEvent.wheel(scroll, { deltaY: 100 });
    expect(input.onLoadMore).toHaveBeenCalledTimes(2);
  });

  it.each(['short', 'empty'] as const)('makes one first-list request for a %s response and one additional request after a wheel or swipe gesture', async (kind) => {
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
    const input = props();
    let resolveNext!: (page: SorimaruStoryPage) => void;
    const nextPage = new Promise<SorimaruStoryPage>((resolve) => { resolveNext = resolve; });
    if (kind === 'empty') input.groupsState.data!.groups[0].regionCodes.push('second-returned-code');
    const listStories = vi.fn<SorimaruRepository['listStories']>()
      .mockResolvedValueOnce({ items: kind === 'short' ? input.regionStoriesState.items : [], nextCursor: kind === 'short' ? 'actual-next-cursor' : null, hasMore: kind === 'short' })
      .mockReturnValueOnce(nextPage);
    const repository: SorimaruRepository = {
      listStories, getStoryDetail: vi.fn(), listRegionGroups: vi.fn().mockResolvedValue(input.groupsState.data),
    };
    const { container } = render(<RegionSection repository={repository} />);
    await waitFor(() => expect(screen.getByText('25개 이야기')).toBeTruthy());
    expect(repository.listRegionGroups).toHaveBeenCalledOnce();
    expect(listStories).toHaveBeenCalledOnce();
    expect(repository.getStoryDetail).not.toHaveBeenCalled();
    const scroll = scrollContainer(container);
    const gesture = () => {
      if (kind === 'short') fireEvent.wheel(scroll, { deltaY: 100 });
      else {
        fireEvent.touchStart(scroll, { touches: [{ clientY: 250 }] });
        fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 100 }] });
      }
    };
    gesture();
    await waitFor(() => expect(listStories).toHaveBeenCalledTimes(2));
    gesture();
    fireEvent.scroll(scroll);
    expect(listStories).toHaveBeenCalledTimes(2);
    expect(listStories).toHaveBeenLastCalledWith(kind === 'short'
      ? { language: 'ko-KR', regionCode: 'returned-code', limit: 12, cursor: 'actual-next-cursor' }
      : { language: 'ko-KR', regionCode: 'second-returned-code', limit: 12 });
    await act(async () => resolveNext({ items: [], nextCursor: null, hasMore: false }));
    gesture();
    expect(listStories).toHaveBeenCalledTimes(2);
  });

  it('keeps overflow pagination on scroll near the bottom instead of wheel or touch events', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
    const input = props();
    input.regionStoriesState.hasMore = true;
    const { container } = render(<SoundConstellationSection {...input} />);
    const scroll = scrollContainer(container);
    fireEvent.wheel(scroll, { deltaY: 100 });
    fireEvent.touchStart(scroll, { touches: [{ clientY: 250 }] });
    fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 100 }] });
    fireEvent.scroll(scroll, { target: { scrollTop: 100 } });
    expect(input.onLoadMore).not.toHaveBeenCalled();
    fireEvent.scroll(scroll, { target: { scrollTop: 450 } });
    expect(input.onLoadMore).toHaveBeenCalledOnce();
  });

  it('ignores taps, downward swipes, cancelled gestures and exhausted pages', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
    const input = props();
    input.regionStoriesState.hasMore = true;
    const { container, rerender } = render(<SoundConstellationSection {...input} />);
    const scroll = scrollContainer(container);
    fireEvent.touchStart(scroll, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 105 }] });
    fireEvent.touchStart(scroll, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 250 }] });
    fireEvent.touchStart(scroll, { touches: [{ clientY: 250 }] });
    fireEvent.touchCancel(scroll);
    fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 100 }] });
    expect(input.onLoadMore).not.toHaveBeenCalled();
    rerender(<SoundConstellationSection {...input} regionStoriesState={{ ...input.regionStoriesState, hasMore: false }} />);
    fireEvent.wheel(scroll, { deltaY: 100 });
    fireEvent.touchStart(scroll, { touches: [{ clientY: 250 }] });
    fireEvent.touchEnd(scroll, { changedTouches: [{ clientY: 100 }] });
    expect(input.onLoadMore).not.toHaveBeenCalled();
  });
});
