// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
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
});
