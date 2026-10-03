// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HanokInteractiveMapFrame from './HanokInteractiveMapFrame';

vi.mock('next/script', () => ({
  default: (props: { onReady?: () => void }) => (
    <button type="button" data-testid="kakao-sdk" onClick={props.onReady} />
  ),
}));

describe('HanokInteractiveMapFrame', () => {
  const Map = vi.fn(function FakeMap() {
    return {
      getLevel: () => 11,
      panTo: vi.fn(),
      relayout: vi.fn(),
      setBounds: vi.fn(),
      setLevel: vi.fn(),
    };
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY = 'test-javascript-key';
    Map.mockClear();
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      disconnect() {}
    });
    Object.defineProperty(window, 'kakao', {
      configurable: true,
      value: {
        maps: {
          load: (callback: () => void) => callback(),
          Map,
          LatLng: vi.fn(),
          LatLngBounds: vi.fn(() => ({ extend: vi.fn() })),
          event: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('creates the Kakao map when the SDK is ready', async () => {
    render(<HanokInteractiveMapFrame villages={[]} />);

    fireEvent.click(screen.getByTestId('kakao-sdk'));

    await waitFor(() => expect(Map).toHaveBeenCalledOnce());
    expect(screen.queryByText('지도를 불러오는 중입니다…')).toBeNull();
  });

  it('replaces indefinite loading with a friendly error after 25 seconds', () => {
    vi.useFakeTimers();
    render(<HanokInteractiveMapFrame villages={[]} />);

    act(() => vi.advanceTimersByTime(24_999));
    expect(screen.queryByText('지도를 지금 불러올 수 없어요. 잠시 후 다시 시도해 주세요.')).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('지도를 지금 불러올 수 없어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });
});
