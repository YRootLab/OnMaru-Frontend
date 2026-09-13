import { describe, expect, it, vi } from 'vitest';
import { createKakaoResourceScope } from './kakaoMapResources';

describe('createKakaoResourceScope', () => {
  it('disposes listeners, map resources, timers, and custom cleanup once', () => {
    const removeListener = vi.fn();
    const overlay = { setMap: vi.fn() };
    const marker = { setMap: vi.fn() };
    const clearTimer = vi.fn();
    const cleanup = vi.fn();
    const target = {};
    const listener = vi.fn();
    const scope = createKakaoResourceScope(removeListener);

    scope.trackListener(target, 'zoom_changed', listener);
    scope.trackOverlay(overlay);
    scope.trackMarker(marker);
    scope.trackTimer(7, clearTimer);
    scope.trackCleanup(cleanup);
    scope.dispose();
    scope.dispose();

    expect(removeListener).toHaveBeenCalledWith(target, 'zoom_changed', listener);
    expect(overlay.setMap).toHaveBeenCalledWith(null);
    expect(marker.setMap).toHaveBeenCalledWith(null);
    expect(clearTimer).toHaveBeenCalledWith(7);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
