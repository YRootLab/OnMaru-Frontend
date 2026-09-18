'use client';

import { useEffect, useRef } from 'react';

import { lightPalette, surface } from '@/design-system/tokens';
import { useSceneStore } from './sceneStore';
import { clamp01, lerpHex, usePrefersReducedMotion } from '../components/LandingSectionFrame';

// ─────────────────────────────────────────
// 색상 정거장 — 전부 황갈/한지 계열 (남색 배제)
//
// 같은 색이 두 번 연속 나오는 구간은 색을 유지하고, 다음 정거장으로 넘어갈 때만
// 전환된다 → 5~6% 전환 창이 생겨 눈이 적응할 시간을 준다.
// ─────────────────────────────────────────

const STOPS = [
  { p: 0.0, top: '#241A11', mid: '#1A130C', bot: '#120D08' }, // 영상 구간(어두운 황갈)
  { p: 0.09, top: '#241A11', mid: '#1A130C', bot: '#120D08' },
  // Beat3가 0.12에서 시작하므로 밝은 구간도 함께 당겼다.
  // 여기가 어두우면 Beat3의 회색 본문(#4E5968·#8B95A1)이 배경에 묻힌다.
  { p: 0.12, top: '#2A211A', mid: '#1F1A14', bot: '#161210' },
  { p: 0.17, top: '#EFE4D0', mid: '#F7EEDC', bot: '#FDF6E9' }, // Beat3 밝음
  { p: 0.36, top: '#EFE4D0', mid: '#F7EEDC', bot: '#FDF6E9' },
  { p: 0.5, top: '#26231E', mid: '#1F1D1A', bot: '#161412' }, // Beat4 어둠
  { p: 0.68, top: '#26231E', mid: '#1F1D1A', bot: '#161412' },
  { p: 0.74, top: '#16130F', mid: '#0E0C0A', bot: '#0A0908' }, // Beat5 가장 어두움
  { p: 0.82, top: '#16130F', mid: '#0E0C0A', bot: '#0A0908' },
  { p: 0.9, top: '#F0E6D4', mid: '#F5EDDF', bot: '#FAF3E6' }, // Beat6 밝게 마무리
  { p: 1.0, top: '#F0E6D4', mid: '#F5EDDF', bot: '#FAF3E6' },
];

// 각 텍스처가 지배하는 구간 [start, end]
const TEXTURES = {
  dots: [0.09, 0.22], // 도트 그리드 — 설계도 느낌
  hanji: [0.22, 0.45], // 한지 결 노이즈
  grid: [0.45, 0.72], // 가는 격자선 — 결구
  particles: [0.72, 0.86], // 부유 입자 — 공기감
  light: [0.86, 1.0], // 한지 결 + 미세 광원
};

/** 구간 경계에서 4% 겹치며 crossfade. 양 끝(0·1)은 페이드 없이 유지. */
const FADE = 0.04;

const lerp = (from, to, t) => from + (to - from) * t;

const hexLum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};

/** progress를 감싸는 두 STOP을 찾아 top/mid/bot을 각각 보간한다. */
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

// 한지 노이즈 — feTurbulence를 data-URI로 1회 정의해 두 텍스처가 공유한다.
const HANJI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='hanji' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23hanji)'/%3E%3C/svg%3E\")";

const fill = { position: 'absolute', inset: 0 };

// ─────────────────────────────────────────
// 부유 입자 — Beat5 구간에서만 마운트되어 rAF를 돈다
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
// GlobalBackground
//
// 모든 Beat(z-index 1 이상)보다 아래에 깔려 배경을 전담한다.
//   z0 색상 그라데이션 · z1 구간별 텍스처 · z2 공통 비네트
// ─────────────────────────────────────────

// 계절별 온마루 토큰 배경 그라데이션 매핑
// - 봄 (Spring): surface.light.base ↔ jangmi[50] / juhong[50]
// - 여름 (Summer): surface.light.base ↔ hwanggeum[50]
// - 가을 (Autumn): surface.light.base ↔ hwanggeum[100]
// - 겨울 (Winter): surface.light.base ↔ juhong[200]/juhong[300] — 파랑(kobalt) 대신
//   같은 주황 계열을 더 짙게 써서 브랜드 컬러를 흐트러뜨리지 않는다 (LandingSolarShadow와 동일한 이유)
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

  // 비네트 세기 — 배경이 밝을수록 약하게(0.12), 어두울수록 강하게(0.30)
  const vignette = lerp(0.3, 0.12, clamp01(hexLum(bgMid) / 200));

  const dots = bandOpacity(p, TEXTURES.dots);
  const hanji = bandOpacity(p, TEXTURES.hanji);
  const grid = bandOpacity(p, TEXTURES.grid);
  const particles = bandOpacity(p, TEXTURES.particles);
  const light = bandOpacity(p, TEXTURES.light);

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {/* z0 — 색상 그라데이션 (0.6초 이행 효과 탑재) */}
      <div 
        style={{ 
          ...fill, 
          zIndex: 0, 
          background: gradient, 
          transition: 'background 0.6s ease, background-color 0.6s ease' 
        }} 
      />

      {/* z1 — 구간별 텍스처 (현재 구간 ±crossfade만 DOM에 존재) */}
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



      {/* z1.5 — 온마루 표면 컬러(surface.light.base)와 계절 액센트 subtle 톤(juhong[50], hwanggeum[50], juhong[200], jangmi[50])이 은은하게 섞이는 Mesh/Radial Gradient */}
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

      {/* z2 — 공통 비네트 */}
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
