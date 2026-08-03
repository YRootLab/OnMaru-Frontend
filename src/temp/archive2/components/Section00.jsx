'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

const WORDS = ['단', '하나의', '선도', '우연이', '아닙니다.'];

// 먹 질감 오버레이. feTurbulence 노이즈를 data URI로 구워 외부 이미지 요청 없이 쓴다.
const INK_NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E" +
  "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E" +
  "%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E" +
  "%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const PARTICLE_COUNT = 20;
const PARTICLE_CYCLE_SEC = 30; // 드리프트 1주기
const PARTICLE_DRIFT_PX = 40; // 최대 이동 거리

// prefers-reduced-motion 구독. useEffect + setState로 읽으면 첫 렌더 직후
// 연쇄 렌더가 한 번 더 돌기 때문에 외부 스토어로 구독한다.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

// 서버 렌더 시에는 판단할 수 없으므로 애니메이션이 있는 쪽을 기본값으로 둔다.
const getReducedMotionServer = () => false;

// ─────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────

const Outer = styled.section`
  position: relative;
  width: 100%;
`;

// pin 대상. 100vh 고정.
const Pinned = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0a0908;
  background-image: radial-gradient(circle at 50% 50%, #1c1815 0%, #0a0908 80%);
`;

const InkTexture = styled.div`
  position: absolute;
  inset: 0;
  background-image: url('${INK_NOISE_SVG}');
  background-repeat: repeat;
  background-size: 400px 400px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
`;

// 파티클은 DOM 요소 20개 대신 캔버스 1개로 그린다. 리플로우가 없고
// prefers-reduced-motion일 때 rAF만 끄면 되어 정지 상태 처리도 단순하다.
const ParticleCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
`;

const PhraseContainer = styled.div`
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 90vw;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.28em;
  text-align: center;
`;

const Word = styled.span`
  display: inline-block;
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-weight: 600;
  font-size: clamp(36px, 7vw, 96px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #f4efe4;
  text-shadow: 0 0 20px rgba(244, 239, 228, 0.3);
  will-change: opacity, transform;
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 48px;
  overflow: hidden;
  opacity: 0.4;
  pointer-events: none;
  z-index: 3;
`;

const IndicatorLine = styled.div`
  width: 100%;
  height: 100%;
  background: #f4efe4;
  transform-origin: top;
  animation: section00LineFlow 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;

  @keyframes section00LineFlow {
    0% {
      transform: scaleY(0);
      transform-origin: top;
    }
    50% {
      transform: scaleY(1);
      transform-origin: top;
    }
    50.01% {
      transform: scaleY(1);
      transform-origin: bottom;
    }
    100% {
      transform: scaleY(0);
      transform-origin: bottom;
    }
  }
`;

// prefers-reduced-motion: 흐름 없이 정적인 선만 남긴다.
const StaticIndicatorLine = styled.div`
  width: 100%;
  height: 100%;
  background: #f4efe4;
`;

// ─────────────────────────────────────────
// Section00
// ─────────────────────────────────────────

export default function Section00() {
  const outerRef = useRef(null);
  const pinnedRef = useRef(null);
  const canvasRef = useRef(null);
  const wordRefs = useRef([]);

  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  // ── 부유 파티클 (Canvas + rAF) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      // 화면 비율 좌표로 들고 있어야 리사이즈해도 분포가 유지된다
      nx: Math.random(),
      ny: Math.random(),
      radius: 0.5 + Math.random(), // 지름 1~3px
      alpha: 0.05 + Math.random() * 0.05,
      driftX: Math.random() * 2 - 1,
      driftY: Math.random() * 2 - 1,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (elapsedSec) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';

      const cycle = (elapsedSec / PARTICLE_CYCLE_SEC) * Math.PI * 2;

      for (const p of particles) {
        const x = p.nx * width + Math.sin(cycle + p.phase) * PARTICLE_DRIFT_PX * p.driftX;
        const y = p.ny * height + Math.cos(cycle + p.phase) * PARTICLE_DRIFT_PX * p.driftY;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener('resize', resize);

    if (prefersReduced) {
      // 정지 상태로 한 번만 그린다
      paint(0);
    } else {
      const start = performance.now();
      const tick = (now) => {
        paint((now - start) / 1000);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [prefersReduced]);

  // ── GSAP ScrollTrigger 시퀀스 ──
  useEffect(() => {
    const outer = outerRef.current;
    const pinned = pinnedRef.current;
    const words = wordRefs.current.filter(Boolean);

    if (!outer || !pinned || words.length === 0) return;

    // [접근성] stagger 없이 즉시 노출. pin/scrub 구간도 만들지 않아
    // 150vh짜리 빈 스크롤이 생기지 않게 한다.
    if (prefersReduced) {
      gsap.set(words, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(words, { opacity: 0, y: 10 });

      // scrub 타임라인이라 duration 단위 = 스크롤 progress 0.0~1.0.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          pin: true,
          start: 'top top',
          end: '+=150%',
          scrub: 1,
        },
      });

      // 0.00 ~ 0.10 : 침묵 (배경만)
      tl.to({}, { duration: 0.1 });

      // 0.10 ~ 0.25 : "단"
      tl.to(words[0], { opacity: 1, y: 0, ease: 'power2.out', duration: 0.15 }, 0.1);

      // 0.25 ~ 0.40 : "하나의"
      tl.to(words[1], { opacity: 1, y: 0, ease: 'power2.out', duration: 0.15 }, 0.25);

      // 0.40 ~ 0.55 : "선도" "우연이" "아닙니다."
      // 세 단어를 0.15 슬롯 안에 담아야 해서 stagger를 0.05로 잡았다.
      // 명세의 0.08을 그대로 쓰면 마지막 단어가 0.58에 시작해 슬롯을 넘어간다.
      tl.to(
        words.slice(2),
        { opacity: 1, y: 0, ease: 'power2.out', duration: 0.05, stagger: 0.05 },
        0.4
      );

      // 0.55 ~ 0.75 : 읽기 시간 (변화 없음)
      tl.to({}, { duration: 0.2 }, 0.55);

      // 0.75 ~ 0.85 : 페이드아웃
      tl.to(words, { opacity: 0, y: -20, ease: 'power2.in', duration: 0.1 }, 0.75);

      // 0.85 ~ 1.00 : 완전 검정 (침묵)
      tl.to({}, { duration: 0.15 }, 0.85);
    }, outer);

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <Outer id="section-00" ref={outerRef}>
      <Pinned ref={pinnedRef}>
        <InkTexture />
        <ParticleCanvas ref={canvasRef} aria-hidden="true" />

        <PhraseContainer>
          {WORDS.map((word, i) => (
            <Word
              key={word}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
            >
              {word}
            </Word>
          ))}
        </PhraseContainer>

        <ScrollIndicator aria-hidden="true">
          {prefersReduced ? <StaticIndicatorLine /> : <IndicatorLine />}
        </ScrollIndicator>
      </Pinned>
    </Outer>
  );
}
