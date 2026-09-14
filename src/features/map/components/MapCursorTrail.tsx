'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const TrailCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
`;

interface TrailDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
}

const GOLD_PALETTES = [
  '212, 175, 55',   // #d4af37 gold
  '244, 162, 97',   // soft terracotta
  '255, 193, 7',    // warm amber
  '255, 224, 130',  // pale gold
];

export default function MapCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const dots: TrailDot[] = [];
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const startLoop = () => {
      if (animId === null) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTime < 18) return; // Throttle to ~55fps event processing
      lastTime = now;

      const { clientX: x, clientY: y } = e;
      const dist = Math.hypot(x - lastX, y - lastY);
      if (dist < 4) return; // Ignore micro-jitters

      lastX = x;
      lastY = y;

      // Spawn 1 to 2 subtle golden trail dots
      const count = Math.min(2, Math.max(1, Math.floor(dist / 15)));
      for (let i = 0; i < count; i++) {
        const color = GOLD_PALETTES[Math.floor(Math.random() * GOLD_PALETTES.length)];
        dots.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.4, // float slightly upward
          radius: 1.8 + Math.random() * 1.8,
          alpha: 0.45,
          decay: 0.02 + Math.random() * 0.025,
          color,
        });
      }

      startLoop();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = dots.length - 1; i >= 0; i--) {
        const dot = dots[i];
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.alpha -= dot.decay;
        dot.radius = Math.max(0.2, dot.radius * 0.98);

        if (dot.alpha <= 0) {
          dots.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot.color}, ${dot.alpha})`;
        ctx.shadowColor = `rgba(${dot.color}, ${dot.alpha * 0.6})`;
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      if (dots.length > 0) {
        animId = requestAnimationFrame(render);
      } else {
        animId = null; // Pause loop when no dots are alive
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, []);

  return <TrailCanvas ref={canvasRef} aria-hidden="true" />;
}
