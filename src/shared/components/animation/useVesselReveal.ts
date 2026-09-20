'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { resolveVesselRevealState, type VesselRevealStage } from './vesselRevealState';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface UseVesselRevealOptions {
  exitThresholdRatio?: number;
}

export interface UseVesselRevealResult<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  stage: VesselRevealStage;
  shouldAnimate: boolean;
  prefersReducedMotion: boolean;
}

export function useVesselReveal<T extends HTMLElement = HTMLDivElement>({
  exitThresholdRatio = 0.67,
}: UseVesselRevealOptions = {}): UseVesselRevealResult<T> {
  const containerRef = useRef<T>(null);
  const isReloadProtectedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [{ stage, shouldAnimate }, setState] = useState<{
    stage: VesselRevealStage;
    shouldAnimate: boolean;
  }>({
    stage: 'bloomed',
    shouldAnimate: false,
  });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    hasInitializedRef.current = false;
    isReloadProtectedRef.current = false;
    let currentStage: VesselRevealStage = 'bloomed';

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const next = resolveVesselRevealState({
        currentStage,
        isInitialObservation: !hasInitializedRef.current,
        isReloadProtected: isReloadProtectedRef.current,
        isIntersecting: entry.isIntersecting,
        top: entry.boundingClientRect.top,
        revealBoundary: entry.rootBounds?.bottom ?? window.innerHeight * exitThresholdRatio,
        viewportBottom: window.innerHeight,
      });

      hasInitializedRef.current = true;
      isReloadProtectedRef.current = next.isReloadProtected;
      if (currentStage === next.stage && next.shouldAnimate === false) return;

      currentStage = next.stage;
      setState({
        stage: next.stage,
        shouldAnimate: next.shouldAnimate && !prefersReducedMotion,
      });
    }, {
      rootMargin: `0px 0px -${(1 - exitThresholdRatio) * 100}% 0px`,
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [exitThresholdRatio, prefersReducedMotion]);

  return {
    containerRef,
    stage,
    shouldAnimate,
    prefersReducedMotion,
  };
}
