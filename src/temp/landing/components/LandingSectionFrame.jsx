'use client';

import { useEffect, useState } from 'react';





export function isInBeat(progress, start, end) {
  return progress >= start && (end >= 1 ? progress <= end : progress < end);
}







export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeOutQuad = (t) => 1 - (1 - t) ** 2;
export const easeIn = (t) => t ** 3;


export const progressIn = (value, start, end) => clamp01((value - start) / (end - start));





const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};





export function lerpHex(from, to, t) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);

  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));

  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}





export function lerpStops(stops, t) {
  const at = clamp01(t);

  const next = stops.findIndex(([stop]) => at <= stop);
  if (next <= 0) return stops[next === 0 ? 0 : stops.length - 1][1];

  const [fromStop, fromColor] = stops[next - 1];
  const [toStop, toColor] = stops[next];

  return lerpHex(fromColor, toColor, progressIn(at, fromStop, toStop));
}









export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduced;
}





export default function BeatFrame({ children }) {
  return (
    <section
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        fontFamily: "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 'clamp(20px, 3vw, 36px)',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: '#F4EFE4',
      }}
    >
      {children}
    </section>
  );
}
