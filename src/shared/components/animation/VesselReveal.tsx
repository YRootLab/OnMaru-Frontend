'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  resolveVesselRevealState,
  type VesselRevealScrollDirection,
  type VesselRevealStage,
} from './vesselRevealState';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// SSR에서 useLayoutEffect 사용 시 뜨는 경고를 피하기 위해, 서버에서는 useEffect로 대체한다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface VesselRevealProps {
  /** 감싸서 모핑 언폴딩/폴딩 효과를 적용할 자식 엘리먼트 */
  children: React.ReactNode;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
  /** 고유 ID */
  id?: string;
  /** 진입 초기 축소 비율 (기본값: 0.92 = 92%의 은은한 라운드 캡슐) */
  scaleFrom?: number;
  /** 진입 초기 라운드 캡슐 곡률 (기본값: '2.2rem') */
  roundedFrom?: string;
  /** 하단 캡슐 모핑 트리거 뷰포트 비율 (기본값: 0.67 = 화면 하단 33% 영역 진입 시 선제적 언폴딩/폴딩) */
  exitThresholdRatio?: number;
  /** 애니메이션 지속 시간 (기본값: 0.75s) */
  duration?: number;
  /** 커스텀 인라인 스타일 */
  style?: React.CSSProperties;
}

/**
 * ## VesselReveal (선제적 하단 33% 영역 스크롤 모핑 디자인 패턴)
 * 
 * 아직 보지 않은 섹션은 화면 하단 33% 영역(`vh * 0.67`)에 진입할 때 92% -> 100%로 개화합니다.
 * 위로 되돌아가 하단 경계로 사라질 때 다시 접히며, 새로고침 당시 보이거나 위에 있던 섹션은 펼쳐진 상태를 유지합니다.
 */
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
  const scrollDirectionRef = useRef<VesselRevealScrollDirection>('down');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [{ stage, shouldAnimate }, setState] = useState<{ stage: VesselRevealStage; shouldAnimate: boolean }>({
    // SSR과 hydration 중에는 완성 상태를 그려 현재 viewport가 축소되어 보이는 flash를 막는다.
    stage: 'bloomed',
    shouldAnimate: false,
  });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const initialBoundary = window.innerHeight * exitThresholdRatio;
    const initial = resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      isViewportIntersecting: false,
      scrollDirection: 'down',
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      revealBoundary: initialBoundary,
      viewportBottom: window.innerHeight,
    });

    let currentStage = initial.stage;
    isReloadProtectedRef.current = initial.isReloadProtected;
    const isViewportIntersectingRef = { current: initial.isReloadProtected };
    const isRevealIntersectingRef = {
      current: initial.stage === 'bloomed' && initial.isReloadProtected,
    };
    const previousScrollYRef = { current: window.scrollY };
    const updateScrollDirection = () => {
      const nextScrollY = window.scrollY;
      if (nextScrollY !== previousScrollYRef.current) {
        scrollDirectionRef.current = nextScrollY > previousScrollYRef.current ? 'down' : 'up';
        previousScrollYRef.current = nextScrollY;
      }
    };
    window.addEventListener('scroll', updateScrollDirection, { passive: true });
    setState((previous) => (
      previous.stage === initial.stage
        ? previous
        : { stage: initial.stage, shouldAnimate: false }
    ));

    const applyEntry = (entry: IntersectionObserverEntry, isViewportObserver: boolean) => {
      if (isViewportObserver) {
        isViewportIntersectingRef.current = entry.isIntersecting;
      }
      const revealBoundary = entry.rootBounds?.bottom ?? window.innerHeight * exitThresholdRatio;
      const next = resolveVesselRevealState({
        currentStage,
        isInitialObservation: false,
        isReloadProtected: isReloadProtectedRef.current,
        isIntersecting: isRevealIntersectingRef.current,
        isViewportIntersecting: isViewportIntersectingRef.current,
        scrollDirection: scrollDirectionRef.current,
        top: entry.boundingClientRect.top,
        bottom: entry.boundingClientRect.bottom,
        revealBoundary,
        viewportBottom: window.innerHeight,
      });
      isReloadProtectedRef.current = next.isReloadProtected;
      isReloadProtectedRef.current = next.isReloadProtected;
      if (currentStage === next.stage) return;

      currentStage = next.stage;
      setState({
        stage: next.stage,
        shouldAnimate: next.shouldAnimate && !prefersReducedMotion,
      });
    };

    const revealObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        isRevealIntersectingRef.current = entry.isIntersecting;
        applyEntry(entry, false);
      }
    }, {
      rootMargin: `0px 0px -${(1 - exitThresholdRatio) * 100}% 0px`,
    });
    const viewportObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) applyEntry(entry, true);
    });
    revealObserver.observe(el);
    viewportObserver.observe(el);

    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
      revealObserver.disconnect();
      viewportObserver.disconnect();
    };
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
