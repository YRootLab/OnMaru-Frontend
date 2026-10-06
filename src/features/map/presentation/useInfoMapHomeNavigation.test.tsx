// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useInfoMapHomeNavigation } from './useInfoMapHomeNavigation';

describe('useInfoMapHomeNavigation', () => {
  beforeEach(() => {
    useMapStore.setState(useMapStore.getInitialState(), true);
    class LatLng {
      constructor(public lat: number, public lng: number) {}
    }
    window.kakao = {
      maps: {
        LatLng,
      },
    };
  });

  it('restores Hanok home state, selection, and the captured viewport', () => {
    const map = { setCenter: vi.fn(), setLevel: vi.fn() };
    const viewport = {
      center: { lat: 37.51, lng: 127.02 },
      level: 4,
      radius: 900,
    };
    useMapStore.setState({ map, committedViewport: viewport });
    const { result } = renderHook(() => useInfoMapHomeNavigation());

    act(() => result.current.captureBeforeNavigation());
    act(() => {
      useMapStore.setState({
        infoCategory: 'market',
        infoRegionCode: '11',
        selectedId: 'place-1',
        hoveredId: 'place-1',
        detailId: 'place-1',
      });
      result.current.returnToInfoHome();
    });

    expect(useMapStore.getState()).toMatchObject({
      infoCategory: 'hanok',
      infoRegionCode: null,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      committedViewport: viewport,
    });
    expect(map.setCenter).toHaveBeenCalledWith({ lat: 37.51, lng: 127.02 });
    expect(map.setLevel).toHaveBeenCalledWith(4);
  });

  it('returns direct category URL entries to Hanok without requiring a snapshot', () => {
    useMapStore.setState({ infoCategory: 'market', infoRegionCode: '11' });
    const { result } = renderHook(() => useInfoMapHomeNavigation());

    act(() => result.current.returnToInfoHome());

    expect(useMapStore.getState()).toMatchObject({
      infoCategory: 'hanok',
      infoRegionCode: null,
    });
  });
});
