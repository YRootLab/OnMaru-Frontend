// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { distanceInMeters, useKakaoMap } from './useKakaoMap';
import { DEFAULT_CENTER, useMapStore } from './useMapStore';

describe('distanceInMeters', () => {
  it('같은 좌표는 0', () => {
    expect(distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.815, lng: 127.153 })).toBe(0);
  });

  it('재검색 임계(2km) 판정이 갈리는 지점 — 위도 0.01도 ≒ 1.1km', () => {
    const near = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.825, lng: 127.153 });
    const far = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.845, lng: 127.153 });
    expect(near).toBeLessThan(2000);
    expect(far).toBeGreaterThan(2000);
  });

  it('전주–안동 직선거리 약 169km', () => {
    const d = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 36.5388, lng: 128.8046 });
    expect(d).toBeGreaterThan(160_000);
    expect(d).toBeLessThan(175_000);
  });
});

describe('committed viewport state', () => {
  it('commits center, level, radius and request revision atomically', () => {
    useMapStore.setState({
      center: { lat: 36.4, lng: 127.8 },
      level: 8,
      searchCenter: { lat: 36.35, lng: 127.75 },
      reloadNonce: 10,
      isSearchDirty: true,
    });

    const snapshot = {
      center: { lat: 36.4, lng: 127.8 },
      level: 8,
      radius: 25_000,
    };
    useMapStore.getState().commitViewportSearch(snapshot);

    const state = useMapStore.getState();
    expect(state.searchCenter).toEqual(snapshot.center);
    expect(state.committedViewport).toEqual(snapshot);
    expect(state.reloadNonce).toBe(11);
    expect(state.isSearchDirty).toBe(false);
  });
});

describe('useKakaoMap viewport scheduling', () => {
  let idleListener: (() => void) | undefined;
  let mapCenter = DEFAULT_CENTER;
  let mapLevel = 7;

  beforeEach(() => {
    vi.useFakeTimers();
    idleListener = undefined;
    mapCenter = DEFAULT_CENTER;
    mapLevel = 7;

    class FakeLatLng {
      constructor(
        private readonly lat: number,
        private readonly lng: number,
      ) {}

      getLat() {
        return this.lat;
      }

      getLng() {
        return this.lng;
      }
    }

    class FakeMap {
      getCenter() {
        return new FakeLatLng(mapCenter.lat, mapCenter.lng);
      }

      getLevel() {
        return mapLevel;
      }

      getBounds() {
        return {
          getSouthWest: () => new FakeLatLng(mapCenter.lat - 0.05, mapCenter.lng - 0.05),
          getNorthEast: () => new FakeLatLng(mapCenter.lat + 0.05, mapCenter.lng + 0.05),
        };
      }
    }

    Object.defineProperty(window, 'kakao', {
      configurable: true,
      value: {
        maps: {
          load: (callback: () => void) => callback(),
          LatLng: FakeLatLng,
          Map: FakeMap,
          event: {
            addListener: (_map: unknown, event: string, callback: () => void) => {
              if (event === 'idle') idleListener = callback;
            },
            removeListener: vi.fn(),
          },
        },
      },
    });

    useMapStore.setState({
      map: null,
      center: DEFAULT_CENTER,
      level: 7,
      searchCenter: DEFAULT_CENTER,
      committedViewport: { center: DEFAULT_CENTER, level: 7, radius: 7_000 },
      reloadNonce: 0,
      isSearchDirty: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('coalesces repeated idle events and commits within 200ms after the last event', () => {
    const container = document.createElement('div');
    renderHook(() => useKakaoMap({ current: container }));
    mapLevel = 9;

    act(() => idleListener?.());
    act(() => vi.advanceTimersByTime(100));
    act(() => idleListener?.());
    act(() => vi.advanceTimersByTime(149));
    expect(useMapStore.getState().reloadNonce).toBe(0);

    act(() => vi.advanceTimersByTime(1));
    expect(useMapStore.getState().reloadNonce).toBe(1);
  });

  it('commits a one-level zoom', () => {
    const container = document.createElement('div');
    renderHook(() => useKakaoMap({ current: container }));
    mapLevel = 8;
    mapCenter = { lat: DEFAULT_CENTER.lat + 0.005, lng: DEFAULT_CENTER.lng };

    act(() => idleListener?.());
    act(() => vi.advanceTimersByTime(150));

    expect(useMapStore.getState().reloadNonce).toBe(1);
  });

  it('discards a pending settle when an explicit viewport action commits first', () => {
    const container = document.createElement('div');
    renderHook(() => useKakaoMap({ current: container }));
    mapLevel = 9;

    act(() => idleListener?.());
    act(() => vi.advanceTimersByTime(75));

    const explicitSnapshot = {
      center: { lat: 35.815, lng: 127.153 },
      level: 4,
      radius: 5_000,
    };
    act(() => useMapStore.getState().commitViewportSearch(explicitSnapshot));
    act(() => vi.advanceTimersByTime(500));

    expect(useMapStore.getState().reloadNonce).toBe(1);
    expect(useMapStore.getState().committedViewport).toEqual(explicitSnapshot);
  });
});
