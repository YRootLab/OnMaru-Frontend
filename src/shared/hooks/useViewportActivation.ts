'use client';

import { useEffect, useRef, useState } from 'react';
import { observeViewportOnce } from './viewportActivation';

export interface UseViewportActivationOptions {
  rootMargin?: string;
}

export function useViewportActivation<T extends Element>({
  rootMargin = '600px 0px',
}: UseViewportActivationOptions = {}) {
  const ref = useRef<T>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isActive) return;
    return observeViewportOnce(element, () => setIsActive(true), { rootMargin });
  }, [isActive, rootMargin]);

  return { ref, isActive };
}
