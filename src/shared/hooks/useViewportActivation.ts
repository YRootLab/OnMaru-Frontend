'use client';

import { useEffect, useRef, useState } from 'react';
import { observeViewportOnce, observeViewportPresence } from './viewportActivation';

export interface UseViewportActivationOptions {
  rootMargin?: string;
  once?: boolean;
}

export function useViewportActivation<T extends Element>({
  rootMargin = '600px 0px',
  once = true,
}: UseViewportActivationOptions = {}) {
  const ref = useRef<T>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!once) return;
    const element = ref.current;
    if (!element || isActive) return;
    return observeViewportOnce(element, () => setIsActive(true), { rootMargin });
  }, [isActive, once, rootMargin]);

  useEffect(() => {
    if (once) return;
    const element = ref.current;
    if (!element) return;
    return observeViewportPresence(element, setIsActive, { rootMargin });
  }, [once, rootMargin]);

  return { ref, isActive };
}
