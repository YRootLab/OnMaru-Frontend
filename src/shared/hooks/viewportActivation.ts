export interface ViewportObserver {
  observe(element: Element): void;
  disconnect(): void;
}

export type ViewportObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => ViewportObserver;

export interface ViewportActivationOptions {
  rootMargin?: string;
  observerFactory?: ViewportObserverFactory | null;
}

export function createViewportActivation(onActivate: () => void) {
  let activated = false;

  return {
    activate() {
      if (activated) return;
      activated = true;
      onActivate();
    },
    isActivated() {
      return activated;
    },
  };
}

function getDefaultObserverFactory(): ViewportObserverFactory | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  return (callback, options) => new IntersectionObserver(callback, options);
}

export function observeViewportOnce(
  element: Element,
  onActivate: () => void,
  options: ViewportActivationOptions = {},
): () => void {
  const gate = createViewportActivation(onActivate);
  const observerFactory = options.observerFactory === undefined
    ? getDefaultObserverFactory()
    : options.observerFactory;

  if (!observerFactory) {
    gate.activate();
    return () => undefined;
  }

  let observer: ViewportObserver | null = null;
  observer = observerFactory((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    gate.activate();
    observer?.disconnect();
  }, { rootMargin: options.rootMargin ?? '600px 0px' });
  observer.observe(element);

  return () => observer?.disconnect();
}
