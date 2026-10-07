'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  type FxMode,
  type WarmthParticleEvent,
  useWarmthParticles,
} from '../hooks/useWarmthParticles';
import type { MotionParams } from '../../domain/presence.motion';

export type { WarmthParticleEvent, FxMode };

export interface FrameStats {
  fps: number;
  avgFrameMs: number;
}

export interface WarmthParticleCanvasProps {
  onMount?: (
    enqueueWarmth: (event: WarmthParticleEvent) => void,
    frameStats: RefObject<FrameStats | undefined>,
  ) => void;
  poolingEnabled?: boolean;
  /** 'light'(기본) = 작은 깜빡이는 입자, 'bee' = 벌 비행 연출 */
  fx?: FxMode;
  motionParams?: Partial<MotionParams>;
  onOtherBatch?: (count: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmthParticleCanvas({
  onMount,
  poolingEnabled = true,
  fx = 'light',
  motionParams,
  onOtherBatch,
  className,
  style,
}: WarmthParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueWarmth, frameStats } = useWarmthParticles(canvasRef, {
    poolingEnabled, fx, motionParams, onOtherBatch,
  });

  // onMount 콜백은 한 번만 전달한다
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  useEffect(() => {
    onMountRef.current?.(enqueueWarmth, frameStats);
  }, [enqueueWarmth, frameStats]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
