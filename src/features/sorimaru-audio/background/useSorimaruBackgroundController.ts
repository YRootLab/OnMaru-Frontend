'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion } from 'framer-motion';
import {
  canObserveSorimaruBackground,
  normalizeSorimaruSectionProgress,
  resolveSorimaruMotionState,
  selectDominantSorimaruStage,
  type SorimaruStageObservation,
} from './sorimaruBackgroundController';
import { resolveSorimaruBackgroundScene } from './sorimaruBackgroundScenes';
import type { SorimaruBackgroundStage, SorimaruBackgroundVariant } from './sorimaruBackground.types';

export interface UseSorimaruBackgroundControllerOptions {
  variant: Exclude<SorimaruBackgroundVariant, 'default'>;
  selectedCategory: string;
  isPlaying: boolean;
}

export function useSorimaruBackgroundController({
  variant,
  selectedCategory,
  isPlaying,
}: UseSorimaruBackgroundControllerOptions) {
  const [activeStage, setActiveStage] = useState<SorimaruBackgroundStage>('featured');
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const isReducedMotion = useReducedMotion() ?? false;
  const hasAnimationSupport = canObserveSorimaruBackground(globalThis.IntersectionObserver);
  const activeStageRef = useRef<SorimaruBackgroundStage>('featured');
  const activeMarkerRef = useRef<Element | null>(null);
  const observationsRef = useRef(new Map<Element, SorimaruStageObservation>());
  const pointerFrameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const scrollProgress = useMotionValue(0);

  const motion = useMemo(
    () => resolveSorimaruMotionState({
      isReducedMotion,
      isDocumentVisible,
      isPlaying,
      hasAnimationSupport,
    }),
    [hasAnimationSupport, isDocumentVisible, isPlaying, isReducedMotion],
  );

  const scene = useMemo(
    () => resolveSorimaruBackgroundScene(variant, activeStage, selectedCategory),
    [activeStage, selectedCategory, variant],
  );

  useEffect(() => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('[data-sorimaru-stage]'));
    const observationsByMarker = observationsRef.current;
    const observationSupported = canObserveSorimaruBackground(globalThis.IntersectionObserver);
    if (markers.length === 0 || !observationSupported) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const stage = entry.target.getAttribute('data-sorimaru-stage') as SorimaruBackgroundStage | null;
        if (!stage) continue;
        observationsByMarker.set(entry.target, {
          stage,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          top: entry.boundingClientRect.top,
        });
      }

      const observations = Array.from(observationsByMarker.values());
      const nextStage = selectDominantSorimaruStage(
        observations,
        activeStageRef.current,
        window.innerHeight * 0.18,
      );
      activeStageRef.current = nextStage;
      setActiveStage(nextStage);

      const markerEntries = Array.from(observationsByMarker.entries())
        .filter(([, observation]) => observation.stage === nextStage && observation.isIntersecting)
        .sort(([, left], [, right]) => right.intersectionRatio - left.intersectionRatio);
      activeMarkerRef.current = markerEntries[0]?.[0] ?? activeMarkerRef.current;
    }, {
      threshold: [0, 0.2, 0.4, 0.6, 0.8],
      rootMargin: '-18% 0px -38% 0px',
    });

    for (const marker of markers) observer.observe(marker);

    return () => {
      observer.disconnect();
      observationsByMarker.clear();
      activeMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!motion.parallax) {
      pointerX.set(0);
      pointerY.set(0);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerFrameRef.current !== null) return;
      pointerFrameRef.current = window.requestAnimationFrame(() => {
        const normalizedX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const normalizedY = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        pointerX.set(Math.min(1, Math.max(-1, normalizedX)));
        pointerY.set(Math.min(1, Math.max(-1, normalizedY)));
        pointerFrameRef.current = null;
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (pointerFrameRef.current !== null) window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    };
  }, [motion.parallax, pointerX, pointerY]);

  useEffect(() => {
    const updateScrollProgress = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        const marker = activeMarkerRef.current;
        if (marker instanceof HTMLElement) {
          const bounds = marker.getBoundingClientRect();
          scrollProgress.set(normalizeSorimaruSectionProgress(
            bounds.top,
            bounds.height,
            window.innerHeight,
          ));
        }
        scrollFrameRef.current = null;
      });
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    };
  }, [scrollProgress]);

  return {
    scene,
    motion,
    isDocumentVisible,
    pointerX,
    pointerY,
    scrollProgress,
  };
}
