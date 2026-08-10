'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface VesselRevealProps {
  /** 감싸서 모핑 언폴딩/폴딩 효과를 적용할 자식 엘리먼트 */
  children: React.ReactNode;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
  /** 고유 ID */
  id?: string;
  /** 진입 초기 축소 비율 (기본값: 0.80 = 80%) */
  scaleFrom?: number;
  /** 진입 초기 라운드 캡슐 곡률 (기본값: '2.5rem') */
  roundedFrom?: string;
  /** 뷰포트 감지 임계값 (기본값: 0.12 = 12%) */
  threshold?: number;
  /** 애니메이션 지속 시간 (기본값: 0.85s 고정 럭셔리 이징) */
  duration?: number;
}

/**
 * ## VesselReveal (균일 이징 기반 하단 80% ↔ 100% 스크롤 모핑 디자인 패턴)
 * 
 * 애플(Apple) & 어워즈(Awwwards) 스타일의 스크롤 모핑 인터랙션 컴포넌트입니다.
 * 스크롤 위치나 가속도와 관계없이 매 섹션 12% 진입 시 0.85초의 고급 럭셔리 이징[0.16, 1, 0.3, 1]으로
 * 일정하고 수려하게 80% -> 100% 언폴딩 개화합니다.
 *
 * ### 스크롤 물리 동작 원칙:
 * 1. **아래에서 위로 올라올 때 (하단 진입)**: 0.85s 일정 속도로 80% 캡슐 -> 100% 개화.
 * 2. **위로 계속 올라갈 때 (상단 이탈)**: 100% 유지 (속도 증가 현상 없음).
 * 3. **위에서 아래로 내려올 때 (상단 재진입)**: 100% 유지.
 * 4. **아래로 사라질 때 (하단 이탈)**: 0.85s 일정 속도로 100% -> 80% 캡슐 수축.
 *
 * @example
 * ```tsx
 * <VesselReveal scaleFrom={0.80} duration={0.85}>
 *   <MySectionComponent />
 * </VesselReveal>
 * ```
 */
export const VesselReveal: React.FC<VesselRevealProps> = ({
  children,
  className = '',
  id,
  scaleFrom = 0.80,
  roundedFrom = '2.5rem',
  threshold = 0.12,
  duration = 0.85,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'vessel' | 'bloomed'>('vessel');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 화면 12% 진입 시: 80% -> 100% 일정 속도로 전면 개화
          setStage('bloomed');
        } else {
          // 화면 이탈 시: 하단으로 벗어난 경우에만 80% 캡슐로 수축 폴딩, 상단 이탈은 100% 고정
          if (entry.boundingClientRect.top > 0) {
            setStage('vessel');
          }
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const isBloomed = stage === 'bloomed';

  return (
    <motion.div
      ref={containerRef}
      id={id}
      initial={false}
      animate={{
        scale: isBloomed ? 1 : scaleFrom,
        y: isBloomed ? 0 : 28,
        opacity: isBloomed ? 1 : 0.72,
        borderRadius: isBloomed ? '0.5rem' : roundedFrom,
        borderColor: isBloomed ? 'rgba(33, 30, 25, 0)' : 'rgba(33, 30, 25, 0.14)',
        boxShadow: isBloomed
          ? '0 0px 0px rgba(0, 0, 0, 0)'
          : '0 20px 48px rgba(33, 30, 25, 0.10)',
      }}
      transition={{
        duration,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`border overflow-hidden transition-colors duration-500 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default VesselReveal;
