'use client';

import { useEffect, useRef } from 'react';

import { lightPalette, surface } from '@/design-system/tokens';
import { useSceneStore } from './sceneStore';
import { clamp01, lerpHex, usePrefersReducedMotion } from '../components/LandingSectionFrame';








const STOPS = [
  { p: 0.0, top: '#241A11', mid: '#1A130C', bot: '#120D08' },
  { p: 0.09, top: '#241A11', mid: '#1A130C', bot: '#120D08' },


  { p: 0.12, top: '#2A211A', mid: '#1F1A14', bot: '#161210' },
  { p: 0.17, top: '#EFE4D0', mid: '#F7EEDC', bot: '#FDF6E9' },
  { p: 0.36, top: '#EFE4D0', mid: '#F7EEDC', bot: '#FDF6E9' },
  { p: 0.5, top: '#26231E', mid: '#1F1D1A', bot: '#161412' },
  { p: 0.68, top: '#26231E', mid: '#1F1D1A', bot: '#161412' },
  { p: 0.74, top: '#16130F', mid: '#0E0C0A', bot: '#0A0908' },
  { p: 0.82, top: '#16130F', mid: '#0E0C0A', bot: '#0A0908' },
  { p: 0.9, top: '#F0E6D4', mid: '#F5EDDF', bot: '#FAF3E6' },
  { p: 1.0, top: '#F0E6D4', mid: '#F5EDDF', bot: '#FAF3E6' },
];


const TEXTURES = {
  dots: [0.09, 0.22],
  hanji: [0.22, 0.45],
  grid: [0.45, 0.72],
  particles: [0.72, 0.86],
  light: [0.86, 1.0],
};


const FADE = 0.04;

const lerp = (from, to, t) => from + (to - from) * t;

const hexLum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};


function bgColors(p) {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    if (p >= STOPS[i].p && p <= STOPS[i + 1].p) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const k = clamp01((p - a.p) / (b.p - a.p || 1));
  return {
    top: lerpHex(a.top, b.top, k),
    mid: lerpHex(a.mid, b.mid, k),
    bot: lerpHex(a.bot, b.bot, k),
  };
}

function bandOpacity(p, [start, end]) {
  const up = start <= 0.001 ? 1 : clamp01((p - (start - FADE / 2)) / FADE);
  const down = end >= 0.999 ? 1 : clamp01((end + FADE / 2 - p) / FADE);
  return Math.min(up, down);
}


const HANJI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='hanji' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23hanji)'/%3E%3C/svg%3E\")";

const fill = { position: 'absolute', inset: 0 };





function Particles({ opacity, reduced }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const rand = (min, max) => min + Math.random() * (max - min);
    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: rand(1, 2.5) * dpr,
      a: rand(0.03, 0.07),
      vx: rand(-0.08, 0.08) * dpr,
      vy: rand(-0.08, 0.08) * dpr,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const dot of particles) {
        if (!reduced) {
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < 0) dot.x += canvas.width;
          else if (dot.x > canvas.width) dot.x -= canvas.width;
          if (dot.y < 0) dot.y += canvas.height;
          else if (dot.y > canvas.height) dot.y -= canvas.height;
        }
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 239, 228, ${dot.a})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      style={{ ...fill, position: 'fixed', width: '100%', height: '100%', opacity }}
    />
  );
}














const SEASON_BG_COLORS = {
  spring: { top: '#FAFAFA', mid: '#FFF0F4', bot: '#FFF0E6' },
  summer: { top: '#FAFAFA', mid: '#FFF8E0', bot: '#FFF3D0' },
  autumn: { top: '#FAFAFA', mid: '#FFE898', bot: '#FFDF80' },
  winter: { top: '#FAFAFA', mid: '#FFCBA8', bot: '#FFA36B' },
};

export default function GlobalBackground({ progress }) {
  const reduced = usePrefersReducedMotion();
  const sunState = useSceneStore((s) => s.sun);
  const currentSeason = sunState?.season ?? 'spring';

  const p = clamp01(progress);
  const colors = bgColors(p);

  const isSeasonStage = p >= 0.13 && p <= 0.38;
  const seasonColors = SEASON_BG_COLORS[currentSeason] || SEASON_BG_COLORS.spring;

  const bgTop = isSeasonStage ? seasonColors.top : colors.top;
  const bgMid = isSeasonStage ? seasonColors.mid : colors.mid;
  const bgBot = isSeasonStage ? seasonColors.bot : colors.bot;

  const gradient = `linear-gradient(180deg, ${bgTop} 0%, ${bgMid} 55%, ${bgBot} 100%)`;


  const vignette = lerp(0.3, 0.12, clamp01(hexLum(bgMid) / 200));

  const dots = bandOpacity(p, TEXTURES.dots);
  const hanji = bandOpacity(p, TEXTURES.hanji);
  const grid = bandOpacity(p, TEXTURES.grid);
  const particles = bandOpacity(p, TEXTURES.particles);
  const light = bandOpacity(p, TEXTURES.light);

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {}
      <div
        style={{
          ...fill,
          zIndex: 0,
          background: gradient,
          transition: 'background 0.6s ease, background-color 0.6s ease'
        }}
      />

      {}
      {dots > 0 && (
        <div
          style={{
            ...fill,
            zIndex: 1,
            opacity: dots,
            backgroundImage: 'radial-gradient(circle, rgba(245,166,35,0.16) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {hanji > 0 && (
        <div
          style={{
            ...fill,
            zIndex: 1,
            opacity: 0.035 * hanji,
            backgroundImage: HANJI,
            backgroundSize: '220px 220px',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {grid > 0 && (
        <div
          style={{
            ...fill,
            zIndex: 1,
            opacity: 0.6 * grid,
            backgroundImage:
              'linear-gradient(rgba(245,166,35,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.055) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      {particles > 0 && <Particles opacity={particles} reduced={reduced} />}



      {}
      <div
        style={{
          ...fill,
          zIndex: 1.5,
          background: `
            radial-gradient(ellipse 85% 70% at 50% 22%, ${lightPalette.juhong[50]}90 0%, ${lightPalette.hwanggeum[50]}66 35%, ${lightPalette.juhong[200]}40 70%, transparent 95%),
            radial-gradient(circle at 80% 18%, ${lightPalette.jangmi[50]}70 0%, transparent 45%),
            linear-gradient(180deg, ${surface.light.base}66 0%, transparent 65%)
          `,
        }}
      />

      {}
      <div
        style={{
          ...fill,
          zIndex: 2,
          background: `radial-gradient(ellipse 85% 75% at 50% 50%, transparent 45%, rgba(0,0,0,${vignette.toFixed(
            3,
          )}) 100%)`,
        }}
      />
    </div>
  );
}
