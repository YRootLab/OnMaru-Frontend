'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';

interface AudioReactiveAuraProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
}

const Aura = styled.div`
  pointer-events: none;
  position: absolute;
  inset: -18%;
  z-index: 2;
  opacity: 0;
  will-change: transform, opacity;
  background:
    radial-gradient(circle at 28% 30%, rgba(255, 120, 48, 0.22), transparent 34%),
    radial-gradient(circle at 72% 68%, rgba(255, 163, 107, 0.16), transparent 38%);
  mix-blend-mode: screen;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

export function AudioReactiveAura({ analyserRef, isPlaying }: AudioReactiveAuraProps) {
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    const setScale = gsap.quickSetter(aura, 'scale');
    const setOpacity = gsap.quickSetter(aura, 'opacity');
    const bins = new Uint8Array(64);
    let frameId = 0;
    let smoothedEnergy = 0;

    const render = () => {
      const analyser = analyserRef.current;
      let targetEnergy = 0;
      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(bins);
        targetEnergy = bins.reduce((sum, value) => sum + value, 0) / (bins.length * 255);
      }
      smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.12;
      setScale(1 + smoothedEnergy * 0.22);
      setOpacity(isPlaying ? 0.32 + smoothedEnergy * 0.42 : 0);
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [analyserRef, isPlaying]);

  return <Aura ref={auraRef} aria-hidden="true" />;
}
