'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useVesselReveal } from './useVesselReveal';

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
  const {
    containerRef,
    stage,
    shouldAnimate,
    prefersReducedMotion,
  } = useVesselReveal<HTMLDivElement>({ exitThresholdRatio });

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
        boxSizing: 'border-box',
        display: 'block',
        width: '100%',
        marginInline: 'auto',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderRadius: isBloomed ? '0.5rem' : roundedFrom,
        borderColor: isBloomed ? 'rgba(217, 217, 215, 0)' : 'rgba(205, 205, 202, 0.82)',
        boxShadow: isBloomed ? '0 0px 0px rgba(0, 0, 0, 0)' : '0 16px 36px rgba(24, 24, 23, 0.08)',
        transformOrigin: 'center top',
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
