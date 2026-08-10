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
  const [stage, setStage] = useState<'vessel' | 'bloomed'>('vessel');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // 섹션 상단이 화면 하단 25% 선(vh * 0.75)보다 위에 있고, 아직 화면 전체를 안 벗어난 경우 -> 100% 개화
      if (rect.top < vh * exitThresholdRatio && rect.bottom > 0) {
        setStage('bloomed');
      } 
      // 섹션 상단이 화면 하단 25% 선보다 아래로 떨어지면 -> 뒤늦음 없이 선제적으로 92% 캡슐 수축 폴딩
      else if (rect.top >= vh * exitThresholdRatio) {
        setStage('vessel');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
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
        borderRadius: isBloomed ? '0.5rem' : roundedFrom,
        borderColor: isBloomed ? 'rgba(33, 30, 25, 0)' : 'rgba(33, 30, 25, 0.12)',
        boxShadow: isBloomed
          ? '0 0px 0px rgba(0, 0, 0, 0)'
          : '0 16px 36px rgba(33, 30, 25, 0.08)',
      }}
      transition={{
        duration,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`border overflow-hidden transition-colors duration-500 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default VesselReveal;
