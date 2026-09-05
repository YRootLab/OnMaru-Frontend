'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// SSR에서 useLayoutEffect 사용 시 뜨는 경고를 피하기 위해, 서버에서는 useEffect로 대체한다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import { motion } from 'framer-motion';

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
  /** 하단 캡슐 모핑 트리거 뷰포트 비율 (기본값: 0.75 = 화면 하단 25% 영역 진입 시 선제적 언폴딩/폴딩) */
  exitThresholdRatio?: number;
  /** 애니메이션 지속 시간 (기본값: 0.85s) */
  duration?: number;
}

/**
 * ## VesselReveal (선제적 하단 25% 영역 스크롤 모핑 디자인 패턴)
 * 
 * 섹션 상단이 화면 하단 25% 영역(`vh * 0.75`)에 진입하는 시점에 선제적으로 은은하게 92% -> 100% 개화하며,
 * 사용자가 위로 스크롤하여 하단 25% 영역 이하로 떨어지는 바로 그 순간 뒤늦음 없이 
 * 매끄럽게 92% 라운드 캡슐로 수축 폴딩(Fold)되는 웰메이드 스크롤 컴포넌트입니다.
 */
export const VesselReveal: React.FC<VesselRevealProps> = ({
  children,
  className = '',
  id,
  scaleFrom = 0.92,
  roundedFrom = '2.2rem',
  exitThresholdRatio = 0.75,
  duration = 0.85,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // stage: 현재 캡슐/개화 상태. shouldAnimate: 이 stage로의 전환을 애니메이션으로 보여줄지 여부.
  // 마운트 시점의 최초 보정(새로고침 등으로 이미 화면에 보이는 섹션을 맞추는 것)은
  // shouldAnimate=false로 즉시 스냅시켜, 줄었다 커지는 진입 애니메이션이 보이지 않게 한다.
  const [{ stage, shouldAnimate }, setState] = useState<{ stage: 'vessel' | 'bloomed'; shouldAnimate: boolean }>({
    stage: 'vessel',
    shouldAnimate: false,
  });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isInitial = true;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.isIntersecting
        ? 'bloomed'
        : entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? window.innerHeight * exitThresholdRatio)
          ? 'vessel'
          : null;
      if (!next) return;
      const shouldAnimate = !isInitial;
      isInitial = false;
      setState((prev) => (prev.stage === next && prev.shouldAnimate === shouldAnimate ? prev : { stage: next, shouldAnimate }));
    }, {
      rootMargin: `0px 0px -${(1 - exitThresholdRatio) * 100}% 0px`,
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [exitThresholdRatio]);

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
        borderRadius: isBloomed ? '0.5rem' : roundedFrom,
        borderColor: isBloomed ? 'rgba(33, 30, 25, 0)' : 'rgba(33, 30, 25, 0.12)',
        boxShadow: isBloomed ? '0 0px 0px rgba(0, 0, 0, 0)' : '0 16px 36px rgba(33, 30, 25, 0.08)',
      }}
      transition={{
        duration: shouldAnimate ? duration : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`border overflow-hidden transition-colors duration-500 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default VesselReveal;
