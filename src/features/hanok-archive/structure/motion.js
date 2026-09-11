'use client';

import { useEffect, useState } from 'react';

/**
 * 스크롤 구동 연출의 이징 모음.
 * CSS transition을 걸면 매 프레임 바뀌는 값을 뒤늦게 쫓아가며 밀리므로
 * 같은 감각을 자바스크립트에서 직접 먹인다.
 */
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** start~end 구간을 0~1로 환산한다. 구간 밖은 0 또는 1로 잘린다. */
export const progressIn = (value, start, end) => clamp01((value - start) / (end - start));

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
