'use client';

import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';

import { useJourneyStore } from '../store/useJourneyStore';
import JourneyHeroSearch from './JourneyHeroSearch';
import JourneyDiscoveryFeed from './JourneyDiscoveryFeed';
import JourneyFlowRailSection from './JourneyFlowRailSection';
import JourneyEnrichmentSections from './JourneyEnrichmentSections';
import JourneyAssemblyLoader from './JourneyAssemblyLoader';

const MainWrapper = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-color: #ffffff;
  transition: background-color 0.3s ease;

  [data-theme='dark'] & {
    background-color: #1C1A17;
  }
`;

const AmbientGlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  mask-image: radial-gradient(circle at 50% 38%, black 30%, rgba(0, 0, 0, 0.6) 65%, transparent 90%);
  -webkit-mask-image: radial-gradient(circle at 50% 38%, black 30%, rgba(0, 0, 0, 0.6) 65%, transparent 90%);
`;

/** 마우스 반응 3차원 패럴랙스 트랙 */
const ParallaxWrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
`;

/** GSAP 전용 유기적 유영 오르브 베이스 */
const GlowOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

/** 🌟 Orb 1: 온마루 시그니처 단청 주홍 코어 오르브 */
const PrimaryGlowOrb = styled(GlowOrb)`
  top: 35vh;
  left: 47%;
  width: clamp(380px, 46vw, 680px);
  height: clamp(340px, 40vw, 600px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;

  background: radial-gradient(
    circle at 45% 45%,
    rgba(255, 95, 20, 0.36) 0%,
    rgba(255, 135, 45, 0.22) 36%,
    rgba(255, 190, 85, 0.08) 65%,
    rgba(255, 255, 255, 0) 82%
  );
  filter: blur(48px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 45% 45%,
      rgba(255, 115, 35, 0.42) 0%,
      rgba(250, 155, 65, 0.25) 36%,
      rgba(255, 185, 110, 0.10) 65%,
      rgba(28, 26, 23, 0) 82%
    );
    filter: blur(56px);
  }
`;

/** 🌟 Orb 2: 화사한 황금 옐로우 확산 오라 오르브 */
const SecondaryGlowOrb = styled(GlowOrb)`
  top: 38vh;
  left: 54%;
  width: clamp(340px, 40vw, 580px);
  height: clamp(310px, 36vw, 540px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;

  background: radial-gradient(
    circle at 55% 50%,
    rgba(255, 205, 50, 0.32) 0%,
    rgba(255, 220, 105, 0.18) 38%,
    rgba(255, 240, 165, 0.06) 68%,
    rgba(255, 255, 255, 0) 85%
  );
  filter: blur(44px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 55% 50%,
      rgba(255, 215, 75, 0.36) 0%,
      rgba(255, 225, 125, 0.20) 38%,
      rgba(255, 240, 170, 0.07) 68%,
      rgba(28, 26, 23, 0) 85%
    );
    filter: blur(52px);
  }
`;

/** 🌟 Orb 3: 포근한 앰버 코랄 웜 하이라이트 오르브 */
const TertiaryGlowOrb = styled(GlowOrb)`
  top: 33vh;
  left: 50%;
  width: clamp(300px, 34vw, 500px);
  height: clamp(270px, 32vw, 460px);
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;

  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 155, 45, 0.26) 0%,
    rgba(255, 185, 85, 0.14) 42%,
    rgba(255, 255, 255, 0) 78%
  );
  filter: blur(40px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 165, 55, 0.30) 0%,
      rgba(255, 195, 100, 0.16) 42%,
      rgba(28, 26, 23, 0) 78%
    );
    filter: blur(46px);
  }
`;

const Landing = styled.div<{ $centered: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  ${({ $centered }) =>
    $centered
      ? `
    min-height: 74vh;
    justify-content: center;
    padding-top: 40px;
    padding-bottom: 24px;
  `
      : `
    padding-top: 80px;
    padding-bottom: 12px;
  `}

  @media (max-width: 767px) {
    min-height: 0;
    justify-content: flex-start;
    padding-top: ${({ $centered }) => ($centered ? '32px' : '72px')};
    padding-bottom: 0;
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
`;

export default function JourneyHome() {
  const hasSearched = useJourneyStore((s) => s.hasSearched);
  const mainRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasSearched) return;

    const orb1 = orb1Ref.current;
    const orb2 = orb2Ref.current;
    const orb3 = orb3Ref.current;
    const parallax = parallaxRef.current;

    if (!orb1 || !orb2 || !orb3) return;

    const ctx = gsap.context(() => {
      // 🌟 [Orb 1: 단청 주홍 메인 오르브] - 8자 궤적 유기적 유영 모션
      gsap.set(orb1, { xPercent: -50, yPercent: -50 });
      gsap.to(orb1, {
        x: 140,
        y: -60,
        scale: 1.2,
        rotation: -30,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // 🌟 [Orb 2: 황금 옐로우 오르브] - 반대 방향 교차 유영
      gsap.set(orb2, { xPercent: -50, yPercent: -50 });
      gsap.to(orb2, {
        x: -130,
        y: 70,
        scale: 0.9,
        rotation: 40,
        duration: 6.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // 🌟 [Orb 3: 앰버 코랄 웜 하이라이트] - 중앙 부유 및 호흡
      gsap.set(orb3, { xPercent: -50, yPercent: -50 });
      gsap.to(orb3, {
        x: 70,
        y: 50,
        scale: 1.25,
        duration: 4.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // 🎯 마우스 인터랙티브 패럴랙스 (별도 컨테이너에 적용하여 오르브 트윈과 간섭 0%)
      if (parallax) {
        const xQuick = gsap.quickTo(parallax, 'x', { duration: 0.8, ease: 'power2.out' });
        const yQuick = gsap.quickTo(parallax, 'y', { duration: 0.8, ease: 'power2.out' });

        const onMouseMove = (e: MouseEvent) => {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const deltaX = (e.clientX - centerX) / centerX;
          const deltaY = (e.clientY - centerY) / centerY;

          xQuick(deltaX * 50);
          yQuick(deltaY * 35);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });

        return () => {
          window.removeEventListener('mousemove', onMouseMove);
        };
      }
    });

    return () => {
      ctx.revert();
    };
  }, [hasSearched]);

  return (
    <MainWrapper ref={mainRef}>
      {/* 🟠 GSAP 실시간 살아 숨쉬는 유기적 앰비언트 글로우 */}
      {!hasSearched && (
        <AmbientGlowLayer aria-hidden="true">
          <ParallaxWrapper ref={parallaxRef}>
            <PrimaryGlowOrb ref={orb1Ref} />
            <SecondaryGlowOrb ref={orb2Ref} />
            <TertiaryGlowOrb ref={orb3Ref} />
          </ParallaxWrapper>
        </AmbientGlowLayer>
      )}

      <JourneyAssemblyLoader />

      <Landing $centered={!hasSearched}>
        <JourneyHeroSearch searchFormRef={searchFormRef} moodChipsRef={moodChipsRef} />
      </Landing>

      {/* 검색 전: 풍성한 둘러보기 피드 노출 */}
      {!hasSearched && <JourneyDiscoveryFeed />}

      {/* 검색 후: 여정 플로우 레일 및 실데이터 세부 코스 노출 */}
      {hasSearched && (
        <ContentLayer>
          <JourneyFlowRailSection />
          <JourneyEnrichmentSections />
        </ContentLayer>
      )}
    </MainWrapper>
  );
}
