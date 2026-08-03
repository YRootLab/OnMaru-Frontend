'use client';

import { useEffect, useState } from 'react';

/**
 * 각 Beat이 자기 구간 안인지 판정한다.
 * 끝값 1.0 은 포함해야 마지막 Beat이 스크롤 최하단에서 사라지지 않는다.
 */
export function isInBeat(progress, start, end) {
  return progress >= start && (end >= 1 ? progress <= end : progress < end);
}

// ─────────────────────────────────────────
// 이징
// ─────────────────────────────────────────

// CSS transition을 그대로 걸면 스크롤로 매 프레임 바뀌는 값을 뒤늦게 쫓아가며 밀린다.
// 같은 감각을 유지하되 이징은 자바스크립트에서 직접 먹인다.
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeOutQuad = (t) => 1 - (1 - t) ** 2;
export const easeIn = (t) => t ** 3;

/** start~end 구간을 0~1로 환산한다. 구간 밖은 0 또는 1로 잘린다. */
export const progressIn = (value, start, end) => clamp01((value - start) / (end - start));

// ─────────────────────────────────────────
// 색
// ─────────────────────────────────────────

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * 두 hex 색을 sRGB에서 그대로 섞는다.
 * 색상환을 크게 도는 보간이 아니라 인접한 톤 사이 이동에만 쓴다.
 */
export function lerpHex(from, to, t) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);

  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));

  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * 여러 정거장을 지나는 색 변화. stops는 [지점, 색]을 지점 오름차순으로 준다.
 * 해가 뜨는 것처럼 어둠 → 갈색 → 황금 → 크림으로 넘어가는 경로를 한 번에 태운다.
 */
export function lerpStops(stops, t) {
  const at = clamp01(t);

  const next = stops.findIndex(([stop]) => at <= stop);
  if (next <= 0) return stops[next === 0 ? 0 : stops.length - 1][1];

  const [fromStop, fromColor] = stops[next - 1];
  const [toStop, toColor] = stops[next];

  return lerpHex(fromColor, toColor, progressIn(at, fromStop, toStop));
}

// ─────────────────────────────────────────
// 모션 최소화
// ─────────────────────────────────────────

/**
 * 인라인 스타일로 계산해 넣는 값은 CSS 미디어쿼리로 덮을 수 없다.
 * 값 자체를 갈아끼우려면 자바스크립트에서 설정을 읽어야 한다.
 */
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

/**
 * Beat 공통 껍데기. 아직 내용이 없는 Beat이 placeholder를 얹는 자리다.
 * 실제 내용이 들어오면 각 Beat이 자기 레이아웃을 직접 갖는다.
 */
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
        fontFamily: "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif",
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
