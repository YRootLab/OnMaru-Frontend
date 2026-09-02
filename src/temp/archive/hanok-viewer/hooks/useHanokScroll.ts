'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STAGES } from '@/temp/archive/hanok-viewer/data/hanok.data';
import { useHanokViewerStore } from '@/temp/archive/hanok-viewer/store/useHanokViewerStore';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

let activeLenis: Lenis | null = null;

export function useHanokScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  // 셀렉터 없이 useHanokViewerStore()를 호출하면 스토어 전체를 구독하게 되어,
  // 스크롤마다 갱신되는 scrollProgress 때문에 이 훅을 쓰는 레이아웃이 매 프레임 리렌더된다.
  // 액션만 개별 셀렉터로 집어오면 참조가 고정되어 리렌더가 발생하지 않는다.
  const setScrollProgress = useHanokViewerStore((s) => s.setScrollProgress);
  const setStageProgress = useHanokViewerStore((s) => s.setStageProgress);
  const setIntroProgress = useHanokViewerStore((s) => s.setIntroProgress);
  const setActiveStageIndex = useHanokViewerStore((s) => s.setActiveStageIndex);
  const setActiveSectionId = useHanokViewerStore((s) => s.setActiveSectionId);
  const setIsOrbitEnabled = useHanokViewerStore((s) => s.setIsOrbitEnabled);
  const setHeroProgress = useHanokViewerStore((s) => s.setHeroProgress);
  const setIsReducedMotion = useHanokViewerStore((s) => s.setIsReducedMotion);

  // [접근성] 3D 쪽(조명 페이드인/자동 회전)은 스토어의 isReducedMotion을 보고 분기한다.
  // 각 섹션 컴포넌트의 로컬 state만으로는 캔버스까지 전달되지 않으므로 여기서 한 번만
  // 감지해 전역에 싣는다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setIsReducedMotion]);

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

    // 전체 페이지 스크롤 프로그레스 갱신용 메인 트리거
    const pageTrigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      },
    });

    // 0섹션(인트로), 히어로, 조립, 부재 탐색, 브랜드 소개 섹션 범위 활성화 트리거
    const introEl = document.getElementById('intro-section');
    const heroEl = document.getElementById('hero-section');
    const assemblyEl = document.getElementById('assembly-section');
    const exploreEl = document.getElementById('explore-section');
    const aboutEl = document.getElementById('about-hanok-section');

    const introTrigger = introEl ? ScrollTrigger.create({
      trigger: introEl,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setActiveSectionId('intro');
        setIntroProgress(self.progress);
        setIsOrbitEnabled(false);
      },
      onEnter: () => {
        setActiveSectionId('intro');
        setIsOrbitEnabled(false);
      },
      onEnterBack: () => {
        setActiveSectionId('intro');
        setIsOrbitEnabled(false);
      },
    }) : null;

    const heroTrigger = heroEl
      ? ScrollTrigger.create({
          trigger: heroEl,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            setActiveSectionId('hero');
            setHeroProgress(self.progress);
            setIsOrbitEnabled(false);
          },
          onEnter: () => {
            setActiveSectionId('hero');
            setIsOrbitEnabled(false);
          },
          onEnterBack: () => {
            setActiveSectionId('hero');
            setActiveStageIndex(0);
            setStageProgress(0);
            setIsOrbitEnabled(false);
          },
        })
      : null;


    const assemblyTrigger = assemblyEl ? ScrollTrigger.create({
      trigger: assemblyEl,
      start: 'top top',
      end: 'bottom bottom',
      onEnter: () => setIsOrbitEnabled(false),
      onEnterBack: () => setIsOrbitEnabled(false),
      onUpdate: (self) => {
        setActiveSectionId('assembly');
        const p = self.progress;
        setStageProgress(p);
        const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
        setActiveStageIndex(idx);
      },
    }) : null;

    const exploreTrigger = exploreEl ? ScrollTrigger.create({
      trigger: exploreEl,
      start: 'top center',
      end: 'bottom top',
      onEnter: () => {
        setActiveSectionId('explore');
        setIsOrbitEnabled(true);
      },
      onEnterBack: () => {
        setActiveSectionId('explore');
        setIsOrbitEnabled(true);
      },
      onLeave: () => {
        setIsOrbitEnabled(false);
      },
      onLeaveBack: () => {
        setIsOrbitEnabled(false);
      },
    }) : null;

    const aboutTrigger = aboutEl ? ScrollTrigger.create({
      trigger: aboutEl,
      start: 'top center',
      end: 'bottom top',
      onEnter: () => {
        setActiveSectionId('about');
        setActiveStageIndex(0);
        setStageProgress(0);
        setIsOrbitEnabled(false);
      },
      onEnterBack: () => {
        setActiveSectionId('about');
        setActiveStageIndex(0);
        setStageProgress(0);
        setIsOrbitEnabled(false);
      },
    }) : null;

    setScrollProgress(pageTrigger.progress);
    ScrollTrigger.refresh();

    const t1 = setTimeout(() => ScrollTrigger.refresh(), 100);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener('visibilitychange', handleVisibility);
      pageTrigger.kill();
      introTrigger?.kill();
      heroTrigger?.kill();
      assemblyTrigger?.kill();
      exploreTrigger?.kill();
      aboutTrigger?.kill();

      gsap.ticker.remove(tick);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
      lenisRef.current = null;
    };
  }, [
    setScrollProgress,
    setStageProgress,
    setIntroProgress,
    setHeroProgress,
    setActiveStageIndex,
    setActiveSectionId,
    setIsOrbitEnabled,
  ]);

  const scrollToStage = (index: number) => {
    const assemblyEl = document.getElementById('assembly-section');
    if (!assemblyEl) return;

    const n = STAGES.length;
    const top = assemblyEl.offsetTop;
    const scrollable = assemblyEl.offsetHeight - window.innerHeight;

    const targetProgress = (index + 0.5) / n;
    const target = top + targetProgress * scrollable;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.2 });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return { containerRef, scrollToStage };
}
