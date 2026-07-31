'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setScrollProgress } from '../store/scrollProgress';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * 진행도를 콘솔에 찍는 최소 간격.
 * scrub 타임라인은 초당 60회 갱신되므로 그대로 흘리면 DevTools가 먹통이 되고
 * 다른 로그가 전부 묻힌다. 0.005면 전 구간 스크롤 한 번에 약 200줄이 남는다.
 */
const LOG_STEP = 0.005;

interface OneLongScrollOptions {
  /** console.log 출력 여부. 기본값은 개발 환경에서만 켜짐. */
  debug?: boolean;
}

/**
 * 페이지 전체(document.body)를 하나의 스크롤 구간으로 묶어 진행도를 갱신한다.
 *
 * ScrollTrigger.create()의 onUpdate는 scrub을 타지 않고 스크롤 위치를 그대로 따라간다.
 * scrub: 1의 관성(뒤따라오는 1초짜리 캐치업)을 진행도에 실으려면 트리거 단독이 아니라
 * 프록시 객체를 애니메이션시키고 그 값을 읽어야 한다.
 */
export function useOneLongScroll({
  debug = process.env.NODE_ENV !== 'production',
}: OneLongScrollOptions = {}): void {
  useEffect(() => {
    const proxy = { p: 0 };
    let lastLogged = -1;

    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      onUpdate: () => {
        setScrollProgress(proxy.p);

        if (debug && Math.abs(proxy.p - lastLogged) >= LOG_STEP) {
          lastLogged = proxy.p;
          console.log('[one-long-scroll] scrollProgress =', proxy.p.toFixed(3));
        }
      },
    });

    // 3D 캔버스/이미지가 늦게 올라오면서 문서 높이가 바뀌면 end 지점이 어긋난다.
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') ScrollTrigger.refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      tween.scrollTrigger?.kill();
      tween.kill();
      setScrollProgress(0);
    };
  }, [debug]);
}

export default useOneLongScroll;
