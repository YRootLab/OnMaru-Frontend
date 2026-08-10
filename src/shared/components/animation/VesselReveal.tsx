'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

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
  /** 스크롤 모핑 오프셋 지정 (기본값: ['start 0.98', 'start 0.68']) */
  offsetRange?: [string, string];
}

/**
 * ## VesselReveal (하단 80% ↔ 100% 하단 전용 스크롤 모핑 디자인 패턴)
 * 
 * 애플(Apple) & 어워즈(Awwwards) 스타일의 스크롤 모핑 인터랙션 컴포넌트입니다.
 * 
 * ### 스크롤 물리 동작 원칙:
 * 1. **아래에서 위로 올라올 때 (하단 진입)**: 80% 네모 캡슐 박스에서 100% 전면 개화로 수려하게 펼쳐짐.
 * 2. **위로 계속 올라갈 때 (상단 이탈)**: 100% 고정 (애니메이션 없음).
 * 3. **위에서 아래로 내려올 때 (상단 재진입)**: 100% 고정 (애니메이션 없음).
 * 4. **아래로 사라질 때 (하단 이탈)**: 100%에서 80% 네모 캡슐 박스로 다시 부드럽게 수축 접힘.
 *
 * @example
 * ```tsx
 * <VesselReveal scaleFrom={0.80}>
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
  offsetRange = ['start 0.98', 'start 0.68'],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: offsetRange as [any, any],
  });

  // 하단 진입/이탈 오프셋(98% -> 68%) 구간에서만 80% -> 100% 보간 애니메이션
  // 상단 영역에서는 100% 평면 유지 (상단 무반응)
  const scale = useTransform(scrollYProgress, [0, 1], [scaleFrom, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [32, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.72, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], [roundedFrom, '0.5rem']);
  const borderColor = useTransform(scrollYProgress, [0, 1], ['rgba(33, 30, 25, 0.14)', 'rgba(33, 30, 25, 0)']);
  const boxShadow = useTransform(scrollYProgress, [0, 1], ['0 20px 48px rgba(33, 30, 25, 0.10)', '0 0px 0px rgba(0, 0, 0, 0)']);

  return (
    <motion.div
      ref={containerRef}
      id={id}
      style={{
        scale,
        y,
        opacity,
        borderRadius,
        borderColor,
        boxShadow,
      }}
      className={`border overflow-hidden transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default VesselReveal;
