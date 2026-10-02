'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  type WarmthParticleEvent,
  useWarmthParticles,
} from '../hooks/useWarmthParticles';

export type { WarmthParticleEvent };

export interface WarmthParticleCanvasProps {
  /**
   * 마운트 시 호출됨. 반환된 enqueueWarmth로 부모가 파티클을 주입한다.
   * presentation 규칙: 컴포넌트는 fetch/transport를 소유하지 않는다.
   */
  onMount?: (enqueueWarmth: (event: WarmthParticleEvent) => void) => void;
  poolingEnabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function WarmthParticleCanvas({
  onMount,
  poolingEnabled = true,
  className,
  style,
}: WarmthParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueWarmth } = useWarmthParticles(canvasRef, { poolingEnabled });

  // onMount 콜백은 한 번만 전달한다
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  useEffect(() => {
    onMountRef.current?.(enqueueWarmth);
  }, [enqueueWarmth]);

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
