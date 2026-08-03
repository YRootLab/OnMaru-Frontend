'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STAGES } from './hanok.data';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * 모듈 스코프에 현재 살아 있는 Lenis 인스턴스를 들고 있는다.
 * Fast Refresh는 컴포넌트를 다시 마운트하지만 모듈 스코프는 유지되므로,
 * 이 값으로 이전 인스턴스를 확실히 정리할 수 있다.
 */
let activeLenis: Lenis | null = null;

export interface AnchaeScroll {
  /** 0~1 연속 스크럽 값. 매 프레임 바뀌므로 리렌더를 유발하지 않는 MotionValue로 전달한다. */
  progress: MotionValue<number>;
  /** 0~6 이산 단계. 실제로 바뀔 때만 setState → Framer Motion 전환의 트리거. */
  activeStage: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToStage: (index: number) => void;
}

/**
 * GSAP ScrollTrigger(스크럽) + Lenis(관성 스크롤) + Framer Motion(MotionValue) 하이브리드.
 *
 * 연속값(progress)과 이산값(activeStage)을 분리하는 게 이 훅의 핵심이다.
 * progress를 useState로 들고 있으면 스크롤 1픽셀마다 트리가 리렌더돼서
 * 3D 프레임과 UI가 같이 버벅인다. progress는 MotionValue로 흘려보내고
 * (R3F는 useFrame에서 .get(), UI는 useTransform으로 구독),
 * 단계가 실제로 넘어갈 때만 setState 한다.
 */
export function useAnchaeScroll(): AnchaeScroll {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const [activeStage, setActiveStage] = useState(0);
  const stageRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Lenis는 wheel 이벤트에 preventDefault()를 걸고 스크롤을 자기가 rAF에서 직접 적용한다.
    // 따라서 이전 인스턴스가 살아남으면 "휠은 취소되는데 아무도 스크롤을 적용하지 않는"
    // 완전 잠김 상태가 된다. dev의 Fast Refresh / StrictMode 이중 마운트에서 실제로 발생한다.
    // 새로 만들기 전에 남아 있는 좀비 인스턴스를 반드시 정리한다.
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

    // ticker 콜백에서 예외가 새어 나가면 GSAP이 콜백을 끊어버릴 수 있고,
    // 그 순간 스크롤이 영구히 죽는다. 여기서 삼켜서 최소한 스크롤은 살려둔다.
    const tick = (time: number) => {
      try {
        lenis.raf(time * 1000);
      } catch (err) {
        console.error('[useAnchaeScroll] lenis.raf 실패', err);
      }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // 탭이 백그라운드면 rAF가 아예 실행되지 않아 Lenis 내부 시간이 크게 벌어진다.
    // 복귀 시 재동기화하지 않으면 스크롤이 튀거나 멈춘 것처럼 보인다.
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      lenis.resize();
      ScrollTrigger.refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 2) 컨테이너 전체 구간을 0~1로 정규화하는 스크럽 트리거
    const n = STAGES.length;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.set(self.progress);

        const idx = Math.min(n - 1, Math.max(0, Math.floor(self.progress * n)));
        if (idx !== stageRef.current) {
          stageRef.current = idx;
          setActiveStage(idx);
        }
      },
    });

    // 새로고침 및 DOM 로딩 후 스크롤 위치 계산 재동기화
    progress.set(trigger.progress);
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
  }, [progress]);

  const scrollToStage = (index: number) => {
    const el = containerRef.current;
    if (!el) return;

    const n = STAGES.length;
    const top = el.offsetTop;
    const scrollable = el.offsetHeight - window.innerHeight;
    // 각 단계 구간의 한가운데로 보내야 해당 단계가 온전히 보인다
    const target = top + ((index + 0.5) / n) * scrollable;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.2 });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return { progress, activeStage, containerRef, scrollToStage };
}
