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
export const easeIn = (t) => t ** 3;

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
