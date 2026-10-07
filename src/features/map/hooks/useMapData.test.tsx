// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from './useMapStore';

const { fetchWarmthData } = vi.hoisted(() => ({ fetchWarmthData: vi.fn() }));

vi.mock('@/features/map/services/warmth.service', () => ({ fetchWarmthData }));

import { useMapData } from './useMapData';

const fakeMap = {
  getBounds: () => ({
    getNorthEast: () => ({ getLat: () => 38, getLng: () => 128 }),
  }),
  getCenter: () => ({ getLat: () => 37, getLng: () => 127 }),
};

describe('useMapData request boundary', () => {
  beforeEach(() => {
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      mode: 'info',
      map: fakeMap,
    }, true);
    fetchWarmthData.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not request warmth or legacy places while mode is info', () => {
    renderHook(() => useMapData());

    expect(fetchWarmthData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('passes fetched warmth spots to the renderer', async () => {
    const map = {
      getBounds: () => ({ getNorthEast: () => ({ getLat: () => 37.01, getLng: () => 127.01 }) }),
      getCenter: () => ({ getLat: () => 37, getLng: () => 127 }),
      getLevel: () => 4,
    };
    const spot = {
      id: 'nearby', placeId: 'nearby', name: '인근 지역', lat: 37.2, lng: 127,
      district: '인근 지역', visitorCount: 100, congestionScore: 50,
      congestionLevel: 'moderate' as const, surgeMultiplier: 1, intensity: 0.5,
    };
    fetchWarmthData.mockResolvedValue({ spots: [spot], days: [] });
    useMapStore.setState({ mode: 'warmth', map });

    renderHook(() => useMapData());

    await waitFor(() => expect(useMapStore.getState().heatSpots).toEqual([spot]));
  });
});
