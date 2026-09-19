'use client';

import React, { useLayoutEffect, useRef } from 'react';
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

// height는 JS로 안전선까지만 고정하지만, 거기서 딱 잘라내면 그라데이션이 아직 안 옅어진
// 채로 네모난 단면이 보인다. mask로 바닥 쪽을 한 번 더 부드럽게 죽여서, 안전선에 닿을
// 때는 이미 거의 투명해진 뒤라 어떤 각도로 움직여도 각지게 잘리는 게 안 보이게 한다.
import { keyframes } from '@emotion/react';

const floatOrb1 = keyframes`
  0% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg);
    opacity: 0.85;
  }
  33% {
    transform: translate3d(calc(-50% + 90px), calc(-50% - 60px), 0) scale(1.15) rotate(-25deg);
    opacity: 1;
  }
  66% {
    transform: translate3d(calc(-50% - 70px), calc(-50% + 45px), 0) scale(0.92) rotate(15deg);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1) rotate(0deg);
    opacity: 0.85;
  }
`;

const floatOrb2 = keyframes`
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.95) rotate(0deg);
    opacity: 0.8;
  }
  40% {
    transform: translate3d(calc(-50% - 100px), calc(-50% + 55px), 0) scale(1.18) rotate(35deg);
    opacity: 0.95;
  }
  75% {
    transform: translate3d(calc(-50% + 80px), calc(-50% - 40px), 0) scale(0.88) rotate(-15deg);
    opacity: 0.75;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(0.95) rotate(0deg);
    opacity: 0.8;
  }
`;

const floatOrb3 = keyframes`
  0% {
    transform: translate3d(-50%, -50%, 0) scale(1.05);
    opacity: 0.75;
  }
  50% {
    transform: translate3d(calc(-50% + 60px), calc(-50% + 50px), 0) scale(1.22);
    opacity: 0.95;
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1.05);
    opacity: 0.75;
  }
`;

const AmbientGlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  mask-image: radial-gradient(circle at 50% 38%, black 25%, rgba(0, 0, 0, 0.5) 60%, transparent 85%);
  -webkit-mask-image: radial-gradient(circle at 50% 38%, black 25%, rgba(0, 0, 0, 0.5) 60%, transparent 85%);
`;

/** 마우스 반응 패럴랙스 컨테이너 */
const ParallaxWrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1);
  will-change: transform;
`;

/** 살아 숨쉬는 유기적 단청 주홍 & 황금빛 앰비언트 오르브들 */
const GlowOrbBase = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

const PrimaryGlowOrb = styled(GlowOrbBase)`
  top: 36vh;
  left: 48%;
  width: clamp(360px, 44vw, 640px);
  height: clamp(320px, 38vw, 560px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;
  animation: ${floatOrb1} 10s ease-in-out infinite;

  /* 은은하고 생동감 있는 단청 주홍 코어 */
  background: radial-gradient(
    circle at 45% 45%,
    rgba(255, 95, 20, 0.30) 0%,
    rgba(255, 140, 50, 0.17) 38%,
    rgba(255, 195, 95, 0.06) 65%,
    rgba(255, 255, 255, 0) 82%
  );
  filter: blur(52px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 45% 45%,
      rgba(255, 115, 35, 0.36) 0%,
      rgba(250, 155, 65, 0.20) 38%,
      rgba(255, 185, 110, 0.08) 65%,
      rgba(28, 26, 23, 0) 82%
    );
    filter: blur(60px);
  }
`;

const SecondaryGlowOrb = styled(GlowOrbBase)`
  top: 38vh;
  left: 53%;
  width: clamp(320px, 38vw, 540px);
  height: clamp(290px, 35vw, 500px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;
  animation: ${floatOrb2} 12s ease-in-out infinite;

  /* 부드러운 황금 옐로우 확산 오라 */
  background: radial-gradient(
    circle at 55% 50%,
    rgba(255, 205, 55, 0.26) 0%,
    rgba(255, 220, 110, 0.13) 40%,
    rgba(255, 240, 165, 0.04) 68%,
    rgba(255, 255, 255, 0) 85%
  );
  filter: blur(48px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 55% 50%,
      rgba(255, 215, 75, 0.30) 0%,
      rgba(255, 225, 125, 0.16) 40%,
      rgba(255, 240, 170, 0.05) 68%,
      rgba(28, 26, 23, 0) 85%
    );
    filter: blur(56px);
  }
`;

const TertiaryGlowOrb = styled(GlowOrbBase)`
  top: 34vh;
  left: 50%;
  width: clamp(280px, 32vw, 460px);
  height: clamp(250px, 30vw, 420px);
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
  animation: ${floatOrb3} 8s ease-in-out infinite;

  /* 앰버 코랄 웜 하이라이트 */
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 155, 45, 0.22) 0%,
    rgba(255, 185, 85, 0.10) 45%,
    rgba(255, 255, 255, 0) 78%
  );
  filter: blur(44px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 165, 55, 0.26) 0%,
      rgba(255, 195, 100, 0.12) 45%,
      rgba(28, 26, 23, 0) 78%
    );
    filter: blur(50px);
  }
`;

/**
 * 검색 전에는 검색창을 화면 상단~중앙에 세운다.
 * 검색 후에는 상단 헤더(GNB) 아래 80px 안전 여백에 컴팩트하게 배치한다.
 */
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
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hasSearched) return;

    const parallaxEl = parallaxRef.current;
    if (!parallaxEl) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = ((clientX - centerX) / centerX) * 40;
      const moveY = ((clientY - centerY) / centerY) * 25;

      parallaxEl.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasSearched]);

  return (
    <MainWrapper ref={mainRef}>
      {/* 🟠 상시 60fps로 살아 숨쉬며 자연스럽게 유영하는 인터랙티브 앰비언트 글로우 */}
      {!hasSearched && (
        <AmbientGlowLayer aria-hidden="true">
          <ParallaxWrapper ref={parallaxRef}>
            <PrimaryGlowOrb />
            <SecondaryGlowOrb />
            <TertiaryGlowOrb />
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
