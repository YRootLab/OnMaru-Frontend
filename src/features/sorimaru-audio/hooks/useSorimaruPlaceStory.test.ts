// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSorimaruPlaceStory } from './useSorimaruPlaceStory';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { sorimaruRepository } from '@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository';

vi.mock('@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository', () => ({
  sorimaruRepository: {
    listNearbyStories: vi.fn(),
    searchStoriesByKeyword: vi.fn(),
  },
}));

describe('useSorimaruPlaceStory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSorimaruAudioStore.setState({
      availableStories: [],
    });
    vi.mocked(sorimaruRepository.searchStoriesByKeyword).mockResolvedValue({
      items: [],
      totalCount: 0,
      nextCursor: null,
      hasMore: false,
    });
  });

  it('matches synchronously when availableStories contains the place (Method A)', () => {
    const mockStory = {
      storyId: 'story-1',
      title: '백인제가옥',
      audioTitle: '백인제가옥',
      category: '한옥',
      region: { regionCode: 'kr-11', name: '종로구', level: 'CITY', parentRegionCode: null },
      coordinates: { lat: 37.58, lng: 126.98 },
      durationSeconds: 180,
      imageUrl: null,
      linkedPlaceId: null,
      contentTags: [],
      savedByMe: false,
    };
    useSorimaruAudioStore.setState({ availableStories: [mockStory] });

    const { result } = renderHook(() =>
      useSorimaruPlaceStory('백인제가옥', 37.58, 126.98),
    );

    expect(result.current.story).toEqual(mockStory);
    expect(result.current.loading).toBe(false);
    expect(sorimaruRepository.searchStoriesByKeyword).not.toHaveBeenCalled();
  });

  it('falls back to keyword search when not found locally (Method B)', async () => {
    const mockStory = {
      storyId: 'story-remote-1',
      title: '운현궁 노락당',
      audioTitle: '운현궁 노락당 이야기',
      category: '한옥',
      region: { regionCode: 'kr-11', name: '종로구', level: 'CITY', parentRegionCode: null },
      coordinates: { lat: 37.575, lng: 126.987 },
      durationSeconds: 210,
      imageUrl: null,
      linkedPlaceId: null,
      contentTags: [],
      savedByMe: false,
    };

    vi.mocked(sorimaruRepository.searchStoriesByKeyword).mockResolvedValue({
      items: [mockStory],
      totalCount: 1,
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() =>
      useSorimaruPlaceStory('운현궁', 37.575, 126.987),
    );

    // Initial state: loading
    expect(result.current.loading).toBe(true);

    // Wait for promise resolution
    await act(async () => {
      await Promise.resolve();
    });

    expect(sorimaruRepository.searchStoriesByKeyword).toHaveBeenCalledWith('운현궁');
    expect(result.current.story).toEqual(mockStory);
    expect(result.current.loading).toBe(false);
    expect(useSorimaruAudioStore.getState().availableStories).toContainEqual(mockStory);
  });
});
