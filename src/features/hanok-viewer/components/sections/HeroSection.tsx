'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';

// ─────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────

const OuterContainer = styled.section`
  position: relative;
  width: 100%;
  height: 250vh;
  z-index: 10;
  pointer-events: none;
`;

const StickyViewport = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// 화면 상단 40% 지점에 중앙 정렬 대제목 컨테이너
const TitleContainer = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 90vw;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  pointer-events: auto;
`;

const MainTitleLine = styled.div`
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: clamp(40px, 7vw, 96px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #1c1a17;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  margin: 0;
  will-change: opacity, transform;
  opacity: 0;
`;

const ScaleWordSpan = styled.span`
  display: inline-block;
  will-change: transform, opacity;
`;

// 화면 하단 부제 표기 (font-size 12px, rgba(28,26,23,0.5))
const SubtitleGroup = styled.div`
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(28, 26, 23, 0.5);
  letter-spacing: -0.015em;
  white-space: nowrap;
  text-align: center;
  opacity: 0;
  will-change: opacity, transform;
  pointer-events: auto;

  @media (max-width: 768px) {
    white-space: normal;
    word-break: keep-all;
    bottom: 64px;
    padding: 0 20px;
  }
`;

// 하단 스크롤 인디케이터 (1px 세로선, 2초 주기 흐름 애니메이션)
const ScrollIndicatorGroup = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  will-change: opacity;
  pointer-events: none;
`;

const VerticalLineTrack = styled.div`
  width: 1px;
  height: 28px;
  background: rgba(28, 26, 23, 0.15);
  position: relative;
  overflow: hidden;
  border-radius: 1px;
`;

const VerticalLineFlow = styled.div`
  width: 100%;
  height: 100%;
  background: #d4af37;
  animation: lineFlow 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;

  @keyframes lineFlow {
    0% {
      transform: translateY(-100%);
    }
    50% {
      transform: translateY(0%);
    }
    100% {
      transform: translateY(100%);
    }
  }
`;

// 접근성 prefers-reduced-motion 전용 레이아웃
const ReducedMotionPanel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
`;

const ReducedTitle = styled.h1`
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: clamp(36px, 6.5vw, 84px);
  font-weight: 700;
  color: #1c1a17;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
`;

const ReducedSub = styled.p`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 12px;
  color: rgba(28, 26, 23, 0.5);
  margin: 0;
`;

export default function HeroSection() {
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const scaleWordRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const scrollIndRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const [prefersReduced, setPrefersReduced] = useState(false);
  const heroProgress = useHanokViewerStore((s) => s.heroProgress);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const scaleWord = scaleWordRef.current;
    const sub = subRef.current;
    const scrollInd = scrollIndRef.current;

    if (!line1 || !line2 || !sub || !scrollInd) return;

    // 초기 상태 은폐 설정
    gsap.set([line1, line2, sub, scrollInd], { opacity: 0, y: 10 });
    if (scaleWord) gsap.set(scaleWord, { scale: 0.95 });

    const tl = gsap.timeline({ paused: true });

    // 0.00 ~ 0.55 : 텍스트 숨김 유지
    tl.to({}, { duration: 0.55 });

    // 0.55 ~ 0.70 : "모든 선에는," fade in, y:10->0, ease power2.out
    tl.to(
      line1,
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.15,
      },
      0.55
    );

    // 0.70 ~ 0.85 : "이유가 있습니다." fade in + "있습니다" scale 0.95 -> 1.02 -> 1.0
    tl.to(
      line2,
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.15,
      },
      0.7
    );

    if (scaleWord) {
      tl.to(
        scaleWord,
        {
          scale: 1.02,
          ease: 'back.out(2)',
          duration: 0.08,
        },
        0.78
      );
      tl.to(
        scaleWord,
        {
          scale: 1.0,
          ease: 'power1.out',
          duration: 0.05,
        },
        0.83
      );
    }

    // 0.85 ~ 1.00 : 대제목 유지 + 부제/스크롤 인디케이터 등장
    tl.to(
      [sub, scrollInd],
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.15,
      },
      0.85
    );

    tlRef.current = tl;

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [prefersReduced]);

  // heroProgress 수신 시 GSAP 타임라인Seek
  useEffect(() => {
    if (tlRef.current && !prefersReduced) {
      const p = Math.max(0, Math.min(1, heroProgress));
      tlRef.current.progress(p);
    }
  }, [heroProgress, prefersReduced]);

  if (prefersReduced) {
    return (
      <OuterContainer id="hero-section" style={{ height: 'auto', minHeight: '100vh' }}>
        <StickyViewport style={{ height: 'auto', minHeight: '100vh' }}>
          <ReducedMotionPanel>
            <ReducedTitle>
              모든 선에는,
              <br />
              이유가 있습니다.
            </ReducedTitle>
            <ReducedSub>
              서울 계동 근대 한옥 안채 · 국가유산청 3D 실측 데이터
            </ReducedSub>
          </ReducedMotionPanel>
        </StickyViewport>
      </OuterContainer>
    );
  }

  return (
    <OuterContainer id="hero-section">
      <StickyViewport>
        {/* 화면 상단 40% 지점 대제목 */}
        <TitleContainer>
          <MainTitleLine ref={line1Ref}>모든 선에는,</MainTitleLine>
          <MainTitleLine ref={line2Ref}>
            <span>이유가 </span>
            <ScaleWordSpan ref={scaleWordRef}>있습니다.</ScaleWordSpan>
          </MainTitleLine>
        </TitleContainer>

        {/* 화면 하단 12px 부제 정보 */}
        <SubtitleGroup ref={subRef}>
          서울 계동 근대 한옥 안채 · 국가유산청 3D 실측 데이터
        </SubtitleGroup>

        {/* 하단 1px 세로선 스크롤 인디케이터 */}
        <ScrollIndicatorGroup ref={scrollIndRef}>
          <VerticalLineTrack>
            <VerticalLineFlow />
          </VerticalLineTrack>
        </ScrollIndicatorGroup>
      </StickyViewport>
    </OuterContainer>
  );
}
