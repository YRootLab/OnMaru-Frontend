'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface VesselRevealProps {
  /** 감싸서 모핑 언폴딩 효과를 적용할 자식 엘리먼트 */
  children: React.ReactNode;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
  /** 고유 ID */
  id?: string;
  /** 뷰포트 진입 감지 비율 (기본값: 0.12 = 12%) */
  threshold?: number;
  /** 애니메이션 지속 시간 (초 단위, 기본값: 0.85s) */
  duration?: number;
  /** 시작 시 라운드 캡슐 값 (기본값: '2.5rem') */
  roundedFrom?: string;
  /** 시작 시 축소 비율 (기본값: 0.94) */
  scaleFrom?: number;
  /** 시작 시 하단 이동 거리 (px 단위, 기본값: 28) */
  yFrom?: number;
  /** 최초 1회만 실행 여부 (기본값: true) */
  once?: boolean;
}

/**
 * ## VesselReveal (베슬 리빌 디자인 패턴)
 * 
 * 애플(Apple) 및 어워즈(Awwwards) 스타일의 모던 스크롤 언폴딩 인터랙션 컴포넌트입니다.
 * 화면 하단 threshold(기본 12%) 진입 시 모던 캡슐 박스 상태에서 시작하여 시선 흐름에 따라 
 * 웅장하게 확대(scale 1.0)되면서 외곽 테두리가 사르르 소멸하여 개화합니다.
 *
 * @example
 * ```tsx
 * <VesselReveal threshold={0.12}>
 *   <MySectionComponent />
 * </VesselReveal>
 * ```
 */
export const VesselReveal: React.FC<VesselRevealProps> = ({
  children,
  className = '',
  id,
  threshold = 0.12,
  duration = 0.85,
  roundedFrom = '2.5rem',
  scaleFrom = 0.94,
  yFrom = 28,
  once = true,
}) => {
  return (
    <motion.div
      id={id}
      initial={{
        scale: scaleFrom,
        y: yFrom,
        borderRadius: roundedFrom,
        borderColor: 'rgba(33, 30, 25, 0.14)',
        boxShadow: '0 20px 48px rgba(33, 30, 25, 0.10)',
        opacity: 0.75,
      }}
      whileInView={{
        scale: 1,
        y: 0,
        borderRadius: '0.5rem',
        borderColor: 'rgba(33, 30, 25, 0)',
        boxShadow: '0 0px 0px rgba(0, 0, 0, 0)',
        opacity: 1,
      }}
      viewport={{ once, amount: threshold }}
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
