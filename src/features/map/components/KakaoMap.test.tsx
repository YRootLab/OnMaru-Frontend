// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapLoadError } from '../application/mapLoadError';
import { useMapStore } from '../hooks/useMapStore';
import KakaoMap from './KakaoMap';

const sdk = vi.hoisted(() => ({ init: vi.fn(), reset: vi.fn() }));

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('next/script', () => ({
  default: (props: { onReady?: () => void; onError?: () => void; src: string }) => (
    <button type="button" data-testid="kakao-sdk" data-src={props.src} onClick={props.onReady} onDoubleClick={props.onError} />
  ),
}));
vi.mock('@/design-system/ThemeProvider', () => ({
  useOnmaruTheme: () => ({ mode: 'light', setMode: vi.fn() }),
}));
vi.mock('@/features/map/hooks/useKakaoMap', () => ({
  KAKAO_SDK_SRC: 'https://example.test/kakao-sdk.js',
  useKakaoMap: () => ({ initMap: sdk.init, resetMapInitialization: sdk.reset }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  useMapStore.setState({ map: null, panelOpen: true, isSearchDirty: false, loading: true, placeLoadError: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('KakaoMap SDK failure state', () => {
  it('replaces the pending canvas with an error after 25 seconds', () => {
    render(<KakaoMap />);
    expect(screen.queryByText('지도를 지금 불러올 수 없어요')).toBeNull();

    act(() => { vi.advanceTimersByTime(24_999); });
    expect(screen.queryByText('지도를 지금 불러올 수 없어요')).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('지도를 지금 불러올 수 없어요')).toBeTruthy();
    expect(useMapStore.getState()).toMatchObject({
      loading: true,
      placeLoadError: null,
    });

    fireEvent.click(screen.getByTestId('kakao-sdk'));
    expect(sdk.init).not.toHaveBeenCalled();
    expect(screen.getByText('지도를 지금 불러올 수 없어요')).toBeTruthy();
  });

  it('handles SDK errors and clears them immediately on retry', () => {
    render(<KakaoMap />);
    fireEvent.doubleClick(screen.getByTestId('kakao-sdk'));
    expect(screen.getByText('지도를 지금 불러올 수 없어요')).toBeTruthy();
    sdk.reset.mockClear();

    fireEvent.click(screen.getByRole('button', { name: '지도 다시 불러오기' }));
    expect(screen.queryByText('지도를 지금 불러올 수 없어요')).toBeNull();
    expect(sdk.reset).toHaveBeenCalledOnce();
    expect(useMapStore.getState()).toMatchObject({ loading: true, placeLoadError: null });
  });

  it('keeps loading non-blocking when retrying with existing places', () => {
    useMapStore.setState({
      items: [{
        id: 'stale-place', name: '이전에 불러온 한옥', category: 'spot', lat: 37.5, lng: 127,
        addr: '서울', image: null, tel: null, dist: 100,
      }],
      loading: false,
      placeLoadError: new MapLoadError('unavailable', 503),
    });
    render(<KakaoMap />);
    fireEvent.doubleClick(screen.getByTestId('kakao-sdk'));

    fireEvent.click(screen.getByRole('button', { name: '지도 다시 불러오기' }));

    expect(useMapStore.getState()).toMatchObject({
      loading: false,
      placeLoadError: { kind: 'unavailable' },
    });
  });
});
