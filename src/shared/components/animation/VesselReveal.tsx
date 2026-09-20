'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { resolveVesselRevealState, type VesselRevealStage } from './vesselRevealState';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface VesselRevealProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  scaleFrom?: number;
  roundedFrom?: string;
  exitThresholdRatio?: number;
  duration?: number;
  style?: React.CSSProperties;
}

export const VesselReveal: React.FC<VesselRevealProps> = ({
  children,
  className = '',
  id,
  scaleFrom = 0.92,
  roundedFrom = '2.2rem',
  exitThresholdRatio = 0.67,
  duration = 0.75,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReloadProtectedRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [{ stage, shouldAnimate }, setState] = useState<{ stage: VesselRevealStage; shouldAnimate: boolean }>({
    stage: 'bloomed',
    shouldAnimate: false,
  });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const initial = resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: el.getBoundingClientRect().top,
      revealBoundary: window.innerHeight * exitThresholdRatio,
      viewportBottom: window.innerHeight,
    });

    let currentStage = initial.stage;
    isReloadProtectedRef.current = initial.isReloadProtected;
    setState((previous) => (
      previous.stage === initial.stage
        ? previous
        : { stage: initial.stage, shouldAnimate: false }
    ));

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const next = resolveVesselRevealState({
        currentStage,
        isInitialObservation: false,
        isReloadProtected: isReloadProtectedRef.current,
        isIntersecting: entry.isIntersecting,
        top: entry.boundingClientRect.top,
        revealBoundary: entry.rootBounds?.bottom ?? window.innerHeight * exitThresholdRatio,
        viewportBottom: window.innerHeight,
      });

      isReloadProtectedRef.current = next.isReloadProtected;
      if (currentStage === next.stage) return;

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

  const isBloomed = stage === 'bloomed';

  return (
    <motion.div
      ref={containerRef}
      id={id}
      initial={false}
      animate={{
        scale: isBloomed ? 1 : scaleFrom,
        y: isBloomed ? 0 : 6,
        opacity: isBloomed ? 1 : 0.88,
      }}
      style={{
        borderStyle: 'solid',
        borderWidth: '1px',
        overflow: 'hidden',
        borderRadius: isBloomed ? '0.5rem' : roundedFrom,
        borderColor: isBloomed ? 'rgba(217, 217, 215, 0)' : 'rgba(205, 205, 202, 0.82)',
        boxShadow: isBloomed ? '0 0px 0px rgba(0, 0, 0, 0)' : '0 16px 36px rgba(24, 24, 23, 0.08)',
        transition: prefersReducedMotion ? 'none' : 'border-color 0.5s ease, box-shadow 0.5s ease',
        ...style,
      }}
      transition={{
        duration: shouldAnimate ? duration : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default VesselReveal;
