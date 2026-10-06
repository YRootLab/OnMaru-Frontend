// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDelayedLoadingVisibility } from './useDelayedLoadingVisibility';

describe('useDelayedLoadingVisibility', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('stays hidden until loading lasts for the full delay', () => {
    const { result } = renderHook(() => useDelayedLoadingVisibility(true, 2_000));

    act(() => vi.advanceTimersByTime(1_999));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('never becomes visible when loading finishes before the delay', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoadingVisibility(loading, 2_000),
      { initialProps: { loading: true } },
    );

    act(() => vi.advanceTimersByTime(1_200));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(1_000));

    expect(result.current).toBe(false);
  });

  it('hides immediately when a long loading cycle completes', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoadingVisibility(loading, 2_000),
      { initialProps: { loading: true } },
    );
    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe(true);

    rerender({ loading: false });

    expect(result.current).toBe(false);
  });

  it('clears a pending timer when unmounted', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDelayedLoadingVisibility(true, 2_000));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
