// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RouteScrollManager from './RouteScrollManager';

let pathname = '/sorimaru';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

beforeEach(() => {
  pathname = '/sorimaru';
  window.history.replaceState(null, '', '/sorimaru');
  window.sessionStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 5000 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  window.scrollTo = vi.fn((options?: ScrollToOptions | number, y?: number) => {
    window.scrollY = typeof options === 'number' ? (y ?? 0) : (options?.top ?? 0);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('RouteScrollManager', () => {
  it('starts an unvisited route at the top and restores a visited route after scroll settles', () => {
    const view = render(<RouteScrollManager />);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });

    window.scrollY = 840;
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(160));

    pathname = '/hanok';
    view.rerender(<RouteScrollManager />);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });

    window.scrollY = 1260;
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(160));

    pathname = '/sorimaru';
    view.rerender(<RouteScrollManager />);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 840, behavior: 'auto' });
  });

  it('does not override anchor navigation', () => {
    window.history.replaceState(null, '', '/sorimaru#sorimaru-archive');

    render(<RouteScrollManager />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('falls back to top without crashing when session storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });

    expect(() => render(<RouteScrollManager />)).not.toThrow();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });
});
