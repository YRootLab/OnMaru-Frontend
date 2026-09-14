'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useMapStore } from '@/features/map/hooks/useMapStore';

const CanvasWrap = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease;
`;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  swaySpeed: number;
  swayAmplitude: number;
  phase: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

const PALETTE = [
  'rgba(255, 183, 77, ',   // amber
  'rgba(255, 138, 101, ',  // coral / juhong
  'rgba(244, 162, 97, ',   // warm terra
  'rgba(224, 159, 62, ',   // gold
  'rgba(255, 209, 102, ',  // soft yellow lantern
];

function createParticle(w: number, h: number, initRandomY = false): Particle {
  const maxLifetime = 180 + Math.random() * 240; // 3~7 seconds
  const lifetime = initRandomY ? Math.random() * maxLifetime : 0;
  const maxAlpha = 0.25 + Math.random() * 0.45; // subtle, never blinding
  const colorPrefix = PALETTE[Math.floor(Math.random() * PALETTE.length)];

  return {
    x: Math.random() * w,
    y: initRandomY ? Math.random() * h : h + 10 + Math.random() * 20,
    size: 1.5 + Math.random() * 2.8,
    speedY: 0.4 + Math.random() * 0.7,
    swaySpeed: 0.015 + Math.random() * 0.025,
    swayAmplitude: 0.5 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
    alpha: 0,
    maxAlpha,
    color: colorPrefix,
    lifetime,
    maxLifetime,
  };
}

export default function WarmthParticleLayer() {
  const mode = useMapStore((s) => s.mode);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isWarmth = mode === 'warmth';

  useEffect(() => {
    if (!isWarmth) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initial pool of ~40 particles
    const PARTICLE_COUNT = 40;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(width, height, true)
    );

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.lifetime++;

        // Upward movement with sway
        p.y -= p.speedY;
        p.phase += p.swaySpeed;
        const currentX = p.x + Math.sin(p.phase) * p.swayAmplitude;

        // Alpha calculation: smooth ramp up, steady, smooth ramp down
        const progress = p.lifetime / p.maxLifetime;
        if (progress < 0.2) {
          p.alpha = (progress / 0.2) * p.maxAlpha;
        } else if (progress > 0.8) {
          p.alpha = ((1 - progress) / 0.2) * p.maxAlpha;
        } else {
          p.alpha = p.maxAlpha;
        }

        // Draw glowing ember particle
        ctx.beginPath();
        ctx.arc(currentX, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
        ctx.shadowColor = 'rgba(255, 170, 50, 0.4)';
        ctx.shadowBlur = p.size * 2;
        ctx.fill();

        // Respawn if expired or floated out of top
        if (p.lifetime >= p.maxLifetime || p.y < -20) {
          particles[i] = createParticle(width, height, false);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isWarmth]);

  return (
    <CanvasWrap $visible={isWarmth} aria-hidden="true">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </CanvasWrap>
  );
}
