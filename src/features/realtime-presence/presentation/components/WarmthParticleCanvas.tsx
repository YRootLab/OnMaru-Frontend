'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  type WarmthParticleEvent,
  useWarmthParticles,
} from '../hooks/useWarmthParticles';
import type { MotionParams } from '../../domain/presence.motion';

export type { WarmthParticleEvent };

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
  motionParams?: Partial<MotionParams>;
  onOtherBatch?: (count: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmthParticleCanvas({
  onMount,
  poolingEnabled = true,
  motionParams,
  onOtherBatch,
  className,
  style,
}: WarmthParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueWarmth, frameStats } = useWarmthParticles(canvasRef, {
    poolingEnabled, motionParams, onOtherBatch,
  });

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
