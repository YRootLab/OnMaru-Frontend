// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapNearbyStories } from './useMapNearbyStories';
import { useMapStore } from './useMapStore';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { sorimaruRepository } from '@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository';

vi.mock('@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository', () => ({
  sorimaruRepository: {
    listNearbyStories: vi.fn(),
    searchStoriesByKeyword: vi.fn(),
  },
}));

describe('useMapNearbyStories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMapStore.setState({
      mode: 'info',
      center: { lat: 37.58, lng: 126.98 },
    });
    useSorimaruAudioStore.setState({
      availableStories: [],
    });
  });

  it('fetches nearby stories and merges into availableStories', async () => {
    const mockStories = [
      {
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
      },
    ];

    vi.mocked(sorimaruRepository.listNearbyStories).mockResolvedValue({
      items: mockStories,
      totalCount: 1,
      nextCursor: null,
      hasMore: false,
    });

    vi.useFakeTimers();
    renderHook(() => useMapNearbyStories(true));

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(sorimaruRepository.listNearbyStories).toHaveBeenCalledWith(37.58, 126.98, 5000, 'ko-KR');
    expect(useSorimaruAudioStore.getState().availableStories).toHaveLength(1);
    expect(useSorimaruAudioStore.getState().availableStories[0].title).toBe('백인제가옥');

    vi.useRealTimers();
  });
});
