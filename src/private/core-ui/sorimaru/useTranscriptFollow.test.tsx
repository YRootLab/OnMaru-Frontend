// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTranscriptFollow } from './useTranscriptFollow';

describe('useTranscriptFollow', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('centers the active line within the transcript scroller', () => {
    const scrollTo = vi.fn();
    const scroller = document.createElement('div');
    scroller.scrollTo = scrollTo;
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });
    Object.defineProperty(scroller, 'scrollTop', { value: 30 });
    scroller.getBoundingClientRect = vi.fn().mockReturnValue({ top: 100 });

    const line = document.createElement('button');
    line.getBoundingClientRect = vi.fn().mockReturnValue({ top: 190, height: 40 });

    const { result, rerender } = renderHook(
      ({ activeLineId }) => useTranscriptFollow({ activeLineId, onSeek: vi.fn() }),
      { initialProps: { activeLineId: undefined as number | undefined } },
    );
    result.current.scrollerRef.current = scroller;
    result.current.activeLineRef.current = line;

    rerender({ activeLineId: 2 });

    expect(scrollTo).toHaveBeenCalledWith({ top: 40, behavior: 'smooth' });
  });
});
