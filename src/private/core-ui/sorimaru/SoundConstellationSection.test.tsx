// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

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

  it('requests more summaries when the supplied page cannot fill the scroll container', () => {
    vi.stubGlobal('IntersectionObserver', Observer);
    const input = props();
    input.regionStoriesState.hasMore = true;
    const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
    try {
      render(<SoundConstellationSection {...input} />);
      expect(input.onLoadMore).toHaveBeenCalledOnce();
    } finally {
      height.mockRestore();
      scrollHeight.mockRestore();
    }
  });
});
