type KakaoListener = (...args: never[]) => unknown;
type RemoveKakaoListener = (target: unknown, eventName: string, listener: KakaoListener) => void;

interface DetachableMapResource {
  setMap(map: null): void;
}

export interface KakaoResourceScope {
  trackListener(target: unknown, eventName: string, listener: KakaoListener): void;
  trackOverlay(overlay: DetachableMapResource): void;
  trackMarker(marker: DetachableMapResource): void;
  trackTimer<T>(timerId: T, clearTimer: (timerId: T) => void): void;
  trackCleanup(cleanup: () => void): void;
  dispose(): void;
}

export function createKakaoResourceScope(removeListener: RemoveKakaoListener): KakaoResourceScope {
  const cleanups: Array<() => void> = [];
  let disposed = false;

  const trackMapResource = (resource: DetachableMapResource) => {
    cleanups.push(() => resource.setMap(null));
  };

  return {
    trackListener(target, eventName, listener) {
      cleanups.push(() => removeListener(target, eventName, listener));
    },
    trackOverlay: trackMapResource,
    trackMarker: trackMapResource,
    trackTimer(timerId, clearTimer) {
      cleanups.push(() => clearTimer(timerId));
    },
    trackCleanup(cleanup) {
      cleanups.push(cleanup);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (let index = cleanups.length - 1; index >= 0; index -= 1) {
        cleanups[index]();
      }
      cleanups.length = 0;
    },
  };
}
