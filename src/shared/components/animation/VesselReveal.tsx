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
  /** 뷰포트 감지 임계값 (기본값: 0.08 = 8% 하단 접촉 시 은은한 언폴딩) */
  threshold?: number;
  /** 애니메이션 지속 시간 (기본값: 0.95s 실크 이징) */
  duration?: number;
}

/**
 * ## VesselReveal (은은하게 대기하다 자연스럽게 펼쳐지는 스크롤 모핑 패턴)
 * 
 * 아래에서 튀어 오르는 팝업 현상(Jump)을 완벽히 억제하고,
 * 하단 경계에서 은은하게 대기하다 시선에 맞춰 실크처럼 92% -> 100% 개화합니다.
 */
export const VesselReveal: React.FC<VesselRevealProps> = ({
  children,
  className = '',
  id,
  scaleFrom = 0.92,
  roundedFrom = '2.2rem',
  threshold = 0.08,
  duration = 0.95,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'vessel' | 'bloomed'>('vessel');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 화면 하단 접촉 시: 위로 점프하지 않고 은은하게 92% -> 100% 개화
          setStage('bloomed');
        } else {
          // 화면 하단으로 완전히 벗어난 경우에만 은은한 라운드 캡슐로 폴딩
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
