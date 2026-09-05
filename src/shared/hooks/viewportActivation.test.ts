import { describe, expect, it, vi } from 'vitest';
import {
  createViewportActivation,
  observeViewportOnce,
  type ViewportObserverFactory,
} from './viewportActivation';

describe('viewport activation', () => {
  it('activates only once', () => {
    const onActivate = vi.fn();
    const gate = createViewportActivation(onActivate);

    gate.activate();
    gate.activate();

    expect(gate.isActivated()).toBe(true);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('disconnects after the first intersecting entry', () => {
    const disconnect = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    const factory: ViewportObserverFactory = (nextCallback) => {
      callback = nextCallback;
      return { observe: vi.fn(), disconnect };
    };
    const onActivate = vi.fn();

    observeViewportOnce({} as Element, onActivate, { observerFactory: factory });
    callback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('activates immediately when IntersectionObserver is unavailable', () => {
    const onActivate = vi.fn();

    const cleanup = observeViewportOnce({} as Element, onActivate, { observerFactory: null });

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(() => cleanup()).not.toThrow();
  });
});
