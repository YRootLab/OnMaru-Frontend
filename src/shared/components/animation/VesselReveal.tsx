'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface VesselRevealProps {
  /** 감싸서 모핑 언폴딩/폴딩 효과를 적용할 자식 엘리먼트 */
  children: React.ReactNode;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
  /** 고유 ID */
  id?: string;
  /** 뷰포트 진입/이탈 감지 비율 (기본값: 0.12 = 12%) */
  threshold?: number;
  /** 애니메이션 지속 시간 (초 단위, 기본값: 0.85s) */
  duration?: number;
  /** 캡슐 형태 라운드 값 (기본값: '2.5rem') */
  roundedVessel?: string;
  /** 이탈/입력 시 축소 비율 (기본값: 0.85 = 85%) */
  scaleVessel?: number;
  /** 이탈/입력 시 Y 이동 거리 (px 단위, 기본값: 24) */
  yVessel?: number;
  /** 최초 1회만 실행 여부 (기본값: false - 양방향 스크롤 모핑 폴딩/언폴딩) */
  once?: boolean;
}

/**
 * ## VesselReveal (베슬 리빌 & 폴딩 모듈 디자인 패턴)
 * 
 * 애플(Apple) 및 어워즈(Awwwards) 스타일의 모던 스크롤 모핑 컴포넌트입니다.
 * 화면 중앙 활성화 시 100% 확대 및 테두리 소멸 개화,
 * 화면 상/하단 이탈 시 85% 네모 라운드 캡슐 보더 박스로 다시 수축 접힘(Fold)되는 
 * 양방향 스크롤 모핑 모듈형 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <VesselReveal threshold={0.12} scaleVessel={0.85}>
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
  roundedVessel = '2.5rem',
  scaleVessel = 0.85,
  yVessel = 24,
  once = false,
}) => {
  return (
    <motion.div
      id={id}
      initial={{
        scale: scaleVessel,
        y: yVessel,
        borderRadius: roundedVessel,
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
