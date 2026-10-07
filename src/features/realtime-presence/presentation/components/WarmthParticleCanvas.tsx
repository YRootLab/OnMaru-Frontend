'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  type WarmthParticleEvent,
  useWarmthParticles,
} from '../hooks/useWarmthParticles';

export type { WarmthParticleEvent };

export interface FrameStats {
  fps: number;
  avgFrameMs: number;
}

export interface WarmthParticleCanvasProps {
  /**
   * 마운트 시 호출됨. 반환된 enqueueWarmth로 부모가 파티클을 주입한다.
   * frameStats ref는 매 프레임 갱신되며, 폴링(setInterval 등)으로 읽을 수 있다.
   * presentation 규칙: 컴포넌트는 fetch/transport를 소유하지 않는다.
   */
  onMount?: (
    enqueueWarmth: (event: WarmthParticleEvent) => void,
    frameStats: RefObject<FrameStats | undefined>,
  ) => void;
  poolingEnabled?: boolean;
  /** false이면 벌 비행 없이 파티클만. 기본 true. */
  beeMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmthParticleCanvas({
  onMount,
  poolingEnabled = true,
  beeMode = true,
  className,
  style,
}: WarmthParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueWarmth, frameStats } = useWarmthParticles(canvasRef, { poolingEnabled, beeMode });

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
