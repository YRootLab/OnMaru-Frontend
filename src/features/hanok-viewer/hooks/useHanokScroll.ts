'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STAGES } from '../data/hanok.data';
import { useHanokViewerStore } from '../store/useHanokViewerStore';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

let activeLenis: Lenis | null = null;
const HERO_SPLIT = 0.12;

export function useHanokScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  // 셀렉터 없이 useHanokViewerStore()를 호출하면 스토어 전체를 구독하게 되어,
  // 스크롤마다 갱신되는 scrollProgress 때문에 이 훅을 쓰는 레이아웃이 매 프레임 리렌더된다.
  // 액션만 개별 셀렉터로 집어오면 참조가 고정되어 리렌더가 발생하지 않는다.
  const setScrollProgress = useHanokViewerStore((s) => s.setScrollProgress);
  const setActiveStageIndex = useHanokViewerStore((s) => s.setActiveStageIndex);
  const setActiveSectionId = useHanokViewerStore((s) => s.setActiveSectionId);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    activeLenis?.destroy();

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    activeLenis = lenis;

    const handleScroll = () => {
      ScrollTrigger.update();
    };

    lenis.on('scroll', handleScroll);

    const tick = (time: number) => {
      try {
        lenis.raf(time * 1000);
      } catch (err) {
        console.error('[useHanokScroll] lenis.raf 실패', err);
      }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      lenis.resize();
      ScrollTrigger.refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const n = STAGES.length;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        setScrollProgress(p);

        if (p < HERO_SPLIT) {
          setActiveSectionId('hero');
          setActiveStageIndex(0);
        } else {
          setActiveSectionId('assembly');
          const pAss = (p - HERO_SPLIT) / (1 - HERO_SPLIT);
          const idx = Math.min(n - 1, Math.max(0, Math.floor(pAss * n)));
          setActiveStageIndex(idx);
        }
      },
    });

    setScrollProgress(trigger.progress);
    ScrollTrigger.refresh();

    const t1 = setTimeout(() => ScrollTrigger.refresh(), 100);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener('visibilitychange', handleVisibility);
      trigger.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
      lenisRef.current = null;
    };
  }, [setScrollProgress, setActiveStageIndex, setActiveSectionId]);

  const scrollToStage = (index: number) => {
    const el = containerRef.current;
    if (!el) return;

    const n = STAGES.length;
    const top = el.offsetTop;
    const scrollable = el.offsetHeight - window.innerHeight;

    // 히어로 분율(0.12) 이후부터 단계별 위치 계산
    const targetProgress = HERO_SPLIT + ((index + 0.5) / n) * (1 - HERO_SPLIT);
    const target = top + targetProgress * scrollable;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.2 });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return { containerRef, scrollToStage };
}
