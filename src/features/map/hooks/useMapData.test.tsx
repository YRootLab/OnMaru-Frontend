// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWarmthData } from '@/features/map/services/warmth.service';
import type { Item, KakaoMap } from '@/features/map/types';
import { useMapStore } from './useMapStore';
import { useMapData } from './useMapData';

vi.mock('@/features/map/services/warmth.service', () => ({
  fetchWarmthData: vi.fn(),
}));

describe('useMapData viewport request scheduling', () => {
  let viewportSpan = 0.05;

  const center = { lat: 36.35123, lng: 127.75123 };
  const place: Item = {
    id: 'place-a',
    name: '장소 A',
    category: 'spot',
    lat: 36.35,
    lng: 127.75,
    addr: '대전광역시',
    image: null,
    tel: null,
    dist: 100,
  };
  const map = {
    getCenter: () => ({
      getLat: () => center.lat,
      getLng: () => center.lng,
    }),
    getBounds: () => ({
      getNorthEast: () => ({
        getLat: () => center.lat + viewportSpan,
        getLng: () => center.lng + viewportSpan,
      }),
    }),
  } as KakaoMap;

  beforeEach(() => {
    viewportSpan = 0.05;
    vi.clearAllMocks();
    vi.mocked(fetchWarmthData).mockResolvedValue({
      source: 'SPRING',
      coverageStatus: 'COMPLETE',
      spots: [],
      days: [],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    useMapStore.setState({
      map,
      mode: 'info',
      category: null,
      center,
      searchCenter: center,
      level: 9,
      reloadNonce: 0,
      items: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not fetch for transient zoom levels and fetches once after the viewport is committed', async () => {
    renderHook(() => useMapData());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(fetchWarmthData).not.toHaveBeenCalled();

    viewportSpan = 0.12;
    await act(async () => {
      useMapStore.getState().setCenter(center, 8);
      await Promise.resolve();
    });

    expect(fetchWarmthData).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);

    act(() => useMapStore.getState().reload());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    expect(fetchWarmthData).not.toHaveBeenCalled();
  });

  it('loads only warmth data while warmth mode is active', async () => {
    useMapStore.setState({
      mode: 'warmth',
      center: { lat: 35.1796, lng: 129.0756 },
      searchCenter: { lat: 35.1796, lng: 129.0756 },
    });

    renderHook(() => useMapData());

    await waitFor(() => expect(fetchWarmthData).toHaveBeenCalledTimes(1));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('clears stale warmth markers after a successful empty response', async () => {
    useMapStore.setState({
      mode: 'warmth',
      heatSpots: [
        {
          id: 'old',
          placeId: 'old-place',
          name: '이전 장소',
          lat: 35.1,
          lng: 129.1,
          district: '부산',
          visitorCount: 10,
          congestionScore: 20,
          congestionLevel: 'relaxed',
          surgeMultiplier: 1,
          intensity: 0.2,
        },
      ],
      heatDays: [{ ymd: '20261002', weekday: '금' }],
    });

    renderHook(() => useMapData());
    await waitFor(() => expect(fetchWarmthData).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useMapStore.getState().heatSpots).toEqual([]));

    expect(useMapStore.getState().heatDays).toEqual([]);
  });

  it('keeps the items reference when a refresh returns fully identical items', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [place] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [{ ...place }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    renderHook(() => useMapData());
    await waitFor(() => expect(useMapStore.getState().items).toEqual([place]));
    const initialItems = useMapStore.getState().items;

    act(() => useMapStore.getState().reload());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(useMapStore.getState().loading).toBe(false));

    expect(useMapStore.getState().items).toBe(initialItems);
  });

  it('keeps existing items visible when a background refresh fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [place] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockRejectedValueOnce(new Error('temporary outage'));

    renderHook(() => useMapData());
    await waitFor(() => expect(useMapStore.getState().items).toEqual([place]));

    act(() => useMapStore.getState().reload());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(useMapStore.getState().items).toEqual([place]);
    expect(useMapStore.getState().loading).toBe(false);
    expect(useMapStore.getState().error).toBeNull();
  });
});
