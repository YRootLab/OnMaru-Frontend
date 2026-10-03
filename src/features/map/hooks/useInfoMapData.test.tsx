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
    servedBbox: '125,35,129,39',
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

  it('requests one first page and sends HANOK to the debounced viewport request', async () => {
    renderHook(() => useInfoMapData());

    await act(async () => Promise.resolve());
    expect(listInfoPlaces).toHaveBeenCalledTimes(1);
    expect(listInfoPlaces).toHaveBeenCalledWith(expect.objectContaining({ category: 'hanok' }));

    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(loadMapViewport).toHaveBeenCalledWith(expect.objectContaining({
      category: 'HANOK',
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

  it('keeps viewport data and skips a new request for a small pan inside servedBbox', async () => {
    const map = useMapStore.getState().map as ReturnType<typeof createMap>;
    renderHook(() => useInfoMapData());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(async () => Promise.resolve());
    expect(loadMapViewport).toHaveBeenCalledTimes(1);

    map.setBounds({ west: 126.1, south: 36.1, east: 128.1, north: 38.1 });
    act(() => useMapStore.getState().setCenter({ lat: 37.1, lng: 127.1 }));
    await act(() => vi.advanceTimersByTimeAsync(700));

    expect(loadMapViewport).toHaveBeenCalledTimes(1);
    expect(useMapStore.getState().viewportRenderMode).toBe('DISTRICT');
  });
});
