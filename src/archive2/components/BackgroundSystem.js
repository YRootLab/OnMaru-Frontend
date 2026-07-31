/**
 * One Long Scroll 배경 그라데이션 시스템.
 *
 * 스크롤 진행도(0~1)를 시간대(새벽 → 아침 → 정오 → 오후 → 저녁)로 읽고,
 * 인접한 두 시간대의 선형 그라데이션과 라디얼 그라데이션을 색상 보간해 document.body 배경에 그린다.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { updateLightForProgress } from './LightingSystem';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────
// 시간대별 그라데이션 정의 (다층 그라데이션)
// ─────────────────────────────────────────

export const timeOfDay = {
  0.0: {
    name: '새벽',
    stops: ['#E8EEF5', '#F5E6D3', '#FFF4E6'],
    radial: { color: 'rgba(232, 90, 24, 0.08)', x: 30, y: 50 },
  },

  0.25: {
    name: '아침',
    stops: ['#F5E6D3', '#FFF4E6', '#FFFAF0'],
    radial: { color: 'rgba(212, 175, 55, 0.06)', x: 40, y: 60 },
  },

  0.5: {
    name: '정오',
    stops: ['#F0F5FA', '#FFFAF0', '#F5EFEA'],
    radial: { color: 'rgba(46, 125, 110, 0.05)', x: 50, y: 50 },
  },

  0.75: {
    name: '오후',
    stops: ['#F5EFEA', '#F0F5FA', '#E8EEF5'],
    radial: { color: 'rgba(43, 92, 230, 0.06)', x: 60, y: 40 },
  },

  1.0: {
    name: '저녁',
    stops: ['#E8EEF5', '#D4E4F7', '#E8EEF5'],
    radial: { color: 'rgba(43, 92, 230, 0.08)', x: 50, y: 30 },
  },
};

/**
 * timeOfDay를 key 오름차순 배열로 정렬
 */
const BANDS = Object.keys(timeOfDay)
  .map((key) => ({ at: Number(key), ...timeOfDay[key] }))
  .sort((a, b) => a.at - b.at);

// ─────────────────────────────────────────
// 1. 색상 및 값 보간 헬퍼 (lerp)
// ─────────────────────────────────────────

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

function hexToRgb(hex) {
  const body = String(hex).replace('#', '');
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;

  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function lerpColor(color1, color2, t) {
  const k = clamp01(t);
  const a = hexToRgb(color1);
  const b = hexToRgb(color2);

  return rgbToHex(
    Math.floor(a[0] + (b[0] - a[0]) * k),
    Math.floor(a[1] + (b[1] - a[1]) * k),
    Math.floor(a[2] + (b[2] - a[2]) * k)
  );
}

function parseRgba(rgbaStr) {
  const match = String(rgbaStr).match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (!match) return [0, 0, 0, 1];
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] !== undefined ? Number(match[4]) : 1,
  ];
}

function lerpRgba(color1, color2, t) {
  const k = clamp01(t);
  const c1 = parseRgba(color1);
  const c2 = parseRgba(color2);

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * k);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * k);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * k);
  const a = Number((c1[3] + (c2[3] - c1[3]) * k).toFixed(3));

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─────────────────────────────────────────
// 2. getGradientForProgress
// ─────────────────────────────────────────

export function getGradientForProgress(progress) {
  const p = clamp01(progress);

  let i = 0;
  while (i < BANDS.length - 2 && p > BANDS[i + 1].at) i++;

  const from = BANDS[i];
  const to = BANDS[i + 1];
  const span = to.at - from.at;
  const t = span <= 0 ? 0 : (p - from.at) / span;

  const lerpedStops = [
    lerpColor(from.stops[0], to.stops[0], t),
    lerpColor(from.stops[1], to.stops[1], t),
    lerpColor(from.stops[2], to.stops[2], t),
  ];

  const radialConfig = {
    x: Math.round(from.radial.x + (to.radial.x - from.radial.x) * t),
    y: Math.round(from.radial.y + (to.radial.y - from.radial.y) * t),
    color: lerpRgba(from.radial.color, to.radial.color, t),
  };

  return { stops: lerpedStops, radial: radialConfig };
}

export function getTimeOfDayName(progress) {
  const p = clamp01(progress);

  let i = 0;
  while (i < BANDS.length - 2 && p > BANDS[i + 1].at) i++;

  const span = BANDS[i + 1].at - BANDS[i].at;
  const t = span <= 0 ? 0 : (p - BANDS[i].at) / span;

  return t < 0.5 ? BANDS[i].name : BANDS[i + 1].name;
}

// ─────────────────────────────────────────
// 3. generateGradientCSS
// ─────────────────────────────────────────

export function generateGradientCSS(stops, radialConfig) {
  const linear = `linear-gradient(180deg, ${stops.join(', ')})`;
  const radial = `radial-gradient(circle at ${radialConfig.x}% ${radialConfig.y}%, ${radialConfig.color} 0%, transparent 70%)`;
  return `${linear}, ${radial}`;
}

// ─────────────────────────────────────────
// 4. updateBackgroundGradient
// ─────────────────────────────────────────

const DEBUG = process.env.NODE_ENV !== 'production';
const LOG_INTERVAL_MS = 100;

let lastCss = null;
let lastLogAt = 0;

export function updateBackgroundGradient(progress) {
  const { stops, radial } = getGradientForProgress(progress);
  const css = generateGradientCSS(stops, radial);

  if (typeof document === 'undefined') return css;

  if (css !== lastCss) {
    lastCss = css;
    document.body.style.background = css;
    document.body.style.backgroundAttachment = 'fixed';
  }

  if (DEBUG) {
    const now = performance.now();
    if (now - lastLogAt >= LOG_INTERVAL_MS) {
      lastLogAt = now;
      console.log('Progress:', progress.toFixed(3), `(${getTimeOfDayName(progress)})`, css);
    }
  }

  return css;
}

// ─────────────────────────────────────────
// initBackgroundSystem
// ─────────────────────────────────────────

function handleProgress(progress) {
  updateBackgroundGradient(progress);
  updateLightForProgress(progress);
}

export function initBackgroundSystem({ subscribe } = {}) {
  if (typeof window === 'undefined') return () => {};

  handleProgress(0);

  if (subscribe) {
    return subscribe(handleProgress);
  }

  const proxy = { p: 0 };

  const tween = gsap.to(proxy, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
    onUpdate: () => handleProgress(proxy.p),
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

export default initBackgroundSystem;
