'use client';

import { useEffect, useState } from 'react';

/**
 * 사용자가 모션 최소화를 켰는가.
 *
 * CSS 미디어쿼리로 끌 수 있는 애니메이션은 CSS에서 끄는 게 낫다.
 * 이 훅은 그걸로 안 되는 것 — setInterval로 도는 자동 회전처럼 자바스크립트가
 * 직접 쥐고 있는 동작 — 을 멈추는 데 쓴다.
 *
 * 서버 렌더에서는 false로 시작해 마운트 직후 실제 값으로 맞춘다.
 */
export function usePrefersReducedMotion(): boolean {
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

export default usePrefersReducedMotion;
