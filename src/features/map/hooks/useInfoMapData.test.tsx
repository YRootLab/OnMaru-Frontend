// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InfoPlacePage, MapViewportResponse } from '../types';
import { useMapStore } from './useMapStore';

const { listInfoPlaces, loadMapViewport } = vi.hoisted(() => ({
  listInfoPlaces: vi.fn(),
  loadMapViewport: vi.fn(),
}));

vi.mock('@/features/map/services/infoMap.service', () => ({
  listInfoPlaces,
  loadMapViewport,
}));

import { useInfoMapData } from './useInfoMapData';

function page(overrides: Partial<InfoPlacePage> = {}): InfoPlacePage {
  return {
    query: { category: 'HANOK' },
    snapshot: { id: 'snap-1', publishedAt: '2026-10-03T00:00:00Z' },
    totalCount: 23_675,
    items: [],
    nextCursor: 'cursor-1',
    appliedCategories: ['HANOK', 'HANOK_STAY', 'HANOK_CAFE', 'HANOK_EXPERIENCE'],
    coverage: 'COMPLETE',
    ...overrides,
  };
}

function viewport(overrides: Partial<MapViewportResponse> = {}): MapViewportResponse {
  return {
    renderMode: 'DISTRICT',
    servedBbox: { west: 125, south: 35, east: 129, north: 39 },
    snapshotId: 'snap-1',
    items: [],
    ...overrides,
  };
}

function createMap() {
  let bounds = { west: 126, south: 36, east: 128, north: 38 };
  return {
    setBounds(next: typeof bounds) {
      bounds = next;
    },
    getBounds: () => ({
      getSouthWest: () => ({ getLat: () => bounds.south, getLng: () => bounds.west }),
      getNorthEast: () => ({ getLat: () => bounds.north, getLng: () => bounds.east }),
    }),
  };
}

describe('useInfoMapData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listInfoPlaces.mockReset();
    loadMapViewport.mockReset();
    listInfoPlaces.mockResolvedValue(page());
    loadMapViewport.mockResolvedValue(viewport());
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      mode: 'info',
      infoCategory: 'hanok',
      map: createMap(),
      level: 9,
    }, true);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('requests the settled viewport within 100ms while keeping the list separate', async () => {
    renderHook(() => useInfoMapData());

    await act(async () => Promise.resolve());
    expect(listInfoPlaces).toHaveBeenCalledTimes(1);
    expect(listInfoPlaces).toHaveBeenCalledWith(expect.objectContaining({ category: 'hanok' }));

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(loadMapViewport).toHaveBeenCalledWith(expect.objectContaining({
      category: 'hanok',
      zoomLevel: 9,
    }));
  });

  it('waits for URL hydration before issuing the single initial list request', async () => {
    const view = renderHook(
      ({ enabled }) => useInfoMapData(enabled),
      { initialProps: { enabled: false } },
    );

    await act(async () => Promise.resolve());
    expect(listInfoPlaces).not.toHaveBeenCalled();

    view.rerender({ enabled: true });
    await act(async () => Promise.resolve());

    expect(listInfoPlaces).toHaveBeenCalledTimes(1);
  });

  it('restarts the first page when the snapshot expires', async () => {
    listInfoPlaces
      .mockRejectedValueOnce({ status: 409, code: 'SNAPSHOT_EXPIRED', message: 'expired' })
      .mockResolvedValueOnce(page({ snapshot: { id: 'snap-2', publishedAt: '2026-10-03T00:01:00Z' } }));

    renderHook(() => useInfoMapData());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(listInfoPlaces).toHaveBeenCalledTimes(2);
    expect(useMapStore.getState().listSnapshotId).toBe('snap-2');
  });

  it('stops automatic snapshot recovery after one failed restart', async () => {
    listInfoPlaces.mockRejectedValue({ status: 409, code: 'SNAPSHOT_EXPIRED', message: 'expired' });

    renderHook(() => useInfoMapData());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(listInfoPlaces).toHaveBeenCalledTimes(2);
    expect(useMapStore.getState().listError).toBe('목록 기준이 만료됐어요. 다시 시도해 주세요');
  });

  it('stops viewport snapshot recovery after one automatic retry', async () => {
    loadMapViewport.mockRejectedValue({
      status: 409,
      code: 'SNAPSHOT_EXPIRED',
      message: 'expired',
    });

    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());

    expect(loadMapViewport).toHaveBeenCalledTimes(2);
    expect(useMapStore.getState().viewportError).toBe(
      '지도 기준이 만료됐어요. 다시 시도해 주세요',
    );
  });

  it('keeps viewport data and skips a new request for a small pan inside servedBbox', async () => {
    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(loadMapViewport).toHaveBeenCalledTimes(1);

    map.setBounds({ west: 126.1, south: 36.1, east: 128.1, north: 38.1 });
    act(() => useMapStore.getState().commitViewportSearch({
      center: { lat: 37.1, lng: 127.1 },
      level: 9,
      radius: 3_000,
    }));
    await act(() => vi.advanceTimersByTimeAsync(700));

    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(useMapStore.getState().viewportRenderMode).toBe('DISTRICT');
  });

  it('refreshes a one-level zoom even when the visible bounds remain inside servedBbox', async () => {
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(async () => Promise.resolve());
    expect(loadMapViewport).toHaveBeenCalledTimes(1);

    act(() => useMapStore.getState().commitViewportSearch({
      center: { lat: 37, lng: 127 },
      level: 10,
      radius: 3_000,
    }));
    await act(() => vi.advanceTimersByTimeAsync(100));

    expect(loadMapViewport).toHaveBeenCalledTimes(2);
    expect(loadMapViewport).toHaveBeenLastCalledWith(expect.objectContaining({ zoomLevel: 10 }));
  });

  it('requests individual places at Kakao level 6', async () => {
    loadMapViewport.mockResolvedValue(viewport({ renderMode: 'PLACE' }));
    useMapStore.setState({
      committedViewport: {
        center: { lat: 37, lng: 127 },
        level: 6,
        radius: 3_000,
      },
    });

    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(async () => Promise.resolve());

    expect(loadMapViewport).toHaveBeenCalledWith(expect.objectContaining({ zoomLevel: 6 }));
    expect(useMapStore.getState().viewportRenderMode).toBe('PLACE');
  });

  it('waits for the committed viewport before requesting after a transient pan', async () => {
    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(listInfoPlaces).toHaveBeenCalledTimes(1);

    map.setBounds({ west: 129, south: 32, east: 131, north: 34 });
    act(() => useMapStore.getState().setCenter({ lat: 33, lng: 130 }, 7));
    await act(() => vi.advanceTimersByTimeAsync(1_000));

    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(listInfoPlaces).toHaveBeenCalledTimes(1);

    act(() => useMapStore.getState().commitViewportSearch({
      center: { lat: 33, lng: 130 },
      level: 7,
      radius: 3_000,
    }));
    await act(() => vi.advanceTimersByTimeAsync(700));

    expect(loadMapViewport).toHaveBeenCalledTimes(2);
    expect(listInfoPlaces).toHaveBeenCalledTimes(1);
  });

  it('keeps the committed bbox stable during the viewport debounce', async () => {
    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());

    map.setBounds({ west: 129, south: 32, east: 131, north: 34 });
    act(() => useMapStore.getState().setCenter({ lat: 33, lng: 130 }, 7));
    await act(() => vi.advanceTimersByTimeAsync(700));

    expect(loadMapViewport).toHaveBeenCalledWith(expect.objectContaining({
      bbox: '125.50000,35.50000,128.50000,38.50000',
      zoomLevel: 9,
    }));
  });

  it('keeps the last aggregate layer when a positive-total response has no items', async () => {
    const districtItem = {
      type: 'DISTRICT' as const,
      name: '서울',
      regionCode: '11',
      count: 42,
      center: { lat: 37.56, lng: 126.98 },
    };
    loadMapViewport
      .mockResolvedValueOnce(viewport({ items: [districtItem], totalCountInViewport: 42 }))
      .mockResolvedValueOnce(viewport({
        servedBbox: { west: 129, south: 32, east: 132, north: 35 },
        items: [],
        totalCountInViewport: 120,
      }));

    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(useMapStore.getState().viewportItems).toEqual([districtItem]);

    map.setBounds({ west: 129, south: 32, east: 131, north: 34 });
    act(() => useMapStore.getState().commitViewportSearch({
      center: { lat: 33, lng: 130 },
      level: 9,
      radius: 3_000,
    }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());

    expect(useMapStore.getState().viewportItems).toEqual([districtItem]);
    expect(useMapStore.getState().viewportError).toBe('이 축척의 지도 집계를 준비하고 있어요');
  });

  it('does not retain aggregate markers from a different category', async () => {
    const districtItem = {
      type: 'DISTRICT' as const,
      name: '서울',
      regionCode: '11',
      count: 42,
      center: { lat: 37.56, lng: 126.98 },
    };
    loadMapViewport
      .mockResolvedValueOnce(viewport({ items: [districtItem], totalCountInViewport: 42 }))
      .mockResolvedValueOnce(viewport({ items: [], totalCountInViewport: 120 }));

    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(useMapStore.getState().viewportItems).toEqual([districtItem]);

    act(() => useMapStore.getState().setInfoCategory('festival'));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());

    expect(useMapStore.getState().viewportItems).toEqual([]);
    expect(useMapStore.getState().viewportError).toBe('이 축척의 지도 집계를 준비하고 있어요');
  });

  it('does not send an inverted bbox after panning completely west of the supported map area', async () => {
    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(loadMapViewport).toHaveBeenCalledTimes(1);

    map.setBounds({ west: 117, south: 35, east: 119, north: 37 });
    act(() => useMapStore.getState().commitViewportSearch({
      center: { lat: 36, lng: 118 },
      level: 9,
      radius: 3_000,
    }));
    await act(() => vi.advanceTimersByTimeAsync(700));

    expect(loadMapViewport).toHaveBeenCalledTimes(1);
  });
});
