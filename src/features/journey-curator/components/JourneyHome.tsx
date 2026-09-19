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

/** 🟠 화면 전체를 감싸며 자연스럽게 숨쉬는 앰비언트 글로우 컨테이너 */
const AmbientGlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

/** GSAP 전용 살아 숨쉬는 유기적 유영 오르브 베이스 */
const GlowOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

/** 🌟 Orb 1: 온마루 시그니처 단청 주홍 코어 오르브 */
const PrimaryGlowOrb = styled(GlowOrb)`
  top: 48%;
  left: 48%;
  width: clamp(240px, 28vw, 380px);
  height: clamp(200px, 24vw, 320px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;

  background: radial-gradient(
    circle at 45% 45%,
    rgba(255, 95, 20, 0.28) 0%,
    rgba(255, 140, 45, 0.16) 36%,
    rgba(255, 195, 90, 0.05) 65%,
    rgba(255, 255, 255, 0) 80%
  );
  filter: blur(32px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 45% 45%,
      rgba(255, 115, 35, 0.32) 0%,
      rgba(250, 155, 65, 0.18) 36%,
      rgba(255, 185, 110, 0.06) 65%,
      rgba(28, 26, 23, 0) 80%
    );
    filter: blur(36px);
  }

  @media (max-width: 767px) {
    top: 36%;
    left: 50%;
    width: clamp(140px, 42vw, 200px);
    height: clamp(110px, 32vw, 150px);
    filter: blur(20px);
  }
`;

/** 🌟 Orb 2: 화사한 황금 옐로우 확산 오라 오르브 */
const SecondaryGlowOrb = styled(GlowOrb)`
  top: 50%;
  left: 53%;
  width: clamp(220px, 25vw, 340px);
  height: clamp(180px, 21vw, 280px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;

  background: radial-gradient(
    circle at 55% 50%,
    rgba(255, 205, 45, 0.24) 0%,
    rgba(255, 220, 100, 0.14) 38%,
    rgba(255, 240, 160, 0.04) 68%,
    rgba(255, 255, 255, 0) 85%
  );
  filter: blur(28px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 55% 50%,
      rgba(255, 215, 75, 0.26) 0%,
      rgba(255, 225, 125, 0.15) 38%,
      rgba(255, 240, 170, 0.05) 68%,
      rgba(28, 26, 23, 0) 85%
    );
    filter: blur(32px);
  }

  @media (max-width: 767px) {
    top: 38%;
    left: 52%;
    width: clamp(130px, 38vw, 180px);
    height: clamp(100px, 28vw, 140px);
    filter: blur(18px);
  }
`;

/** 🌟 Orb 3: 포근한 앰버 코랄 웜 하이라이트 오르브 */
const TertiaryGlowOrb = styled(GlowOrb)`
  top: 46%;
  left: 49%;
  width: clamp(180px, 20vw, 280px);
  height: clamp(150px, 18vw, 240px);
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;

  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 155, 45, 0.22) 0%,
    rgba(255, 185, 85, 0.10) 42%,
    rgba(255, 255, 255, 0) 78%
  );
  filter: blur(24px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 165, 55, 0.24) 0%,
      rgba(255, 195, 100, 0.12) 42%,
      rgba(28, 26, 23, 0) 78%
    );
    filter: blur(28px);
  }

  @media (max-width: 767px) {
    top: 34%;
    left: 48%;
    width: clamp(110px, 34vw, 160px);
    height: clamp(90px, 25vw, 120px);
    filter: blur(16px);
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

    if (!orb1 || !orb2 || !orb3) return;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth <= 768;
      const amp = isMobile ? 0.22 : 1.0;

      // 초기 세팅 (중심 정렬)
      gsap.set([orb1, orb2, orb3], {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: '50% 50%',
      });

      // 🌟 [Orb 1: 단청 주홍] - 정갈한 8자 궤적 자동 유영
      const tl1 = gsap.timeline({ repeat: -1, yoyo: true });
      tl1.to(orb1, {
        x: 130 * amp,
        y: -55 * amp,
        scale: 1.22,
        rotation: -35,
        opacity: 0.98,
        duration: 3.8,
        ease: 'sine.inOut',
      })
      .to(orb1, {
        x: -120 * amp,
        y: 50 * amp,
        scale: 0.90,
        rotation: 25,
        opacity: 0.75,
        duration: 4.2,
        ease: 'sine.inOut',
      })
      .to(orb1, {
        x: 70 * amp,
        y: 65 * amp,
        scale: 1.15,
        rotation: -15,
        opacity: 0.92,
        duration: 3.6,
        ease: 'sine.inOut',
      })
      .to(orb1, {
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
        opacity: 0.85,
        duration: 3.8,
        ease: 'sine.inOut',
      });

      // 🌟 [Orb 2: 황금 옐로우] - 반대 방향에서 교차하며 물결치듯 회전
      const tl2 = gsap.timeline({ repeat: -1, yoyo: true });
      tl2.to(orb2, {
        x: -140 * amp,
        y: 60 * amp,
        scale: 1.25,
        rotation: 45,
        opacity: 0.95,
        duration: 4.4,
        ease: 'sine.inOut',
      })
      .to(orb2, {
        x: 110 * amp,
        y: -50 * amp,
        scale: 0.85,
        rotation: -30,
        opacity: 0.68,
        duration: 4.6,
        ease: 'sine.inOut',
      })
      .to(orb2, {
        x: -60 * amp,
        y: -60 * amp,
        scale: 1.12,
        rotation: 20,
        opacity: 0.88,
        duration: 3.5,
        ease: 'sine.inOut',
      })
      .to(orb2, {
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
        opacity: 0.80,
        duration: 4.0,
        ease: 'sine.inOut',
      });

      // 🌟 [Orb 3: 앰버 코랄 웜] - 중심에서 정갈하게 확장/수축하며 파동
      const tl3 = gsap.timeline({ repeat: -1, yoyo: true });
      tl3.to(orb3, {
        x: 90 * amp,
        y: 65 * amp,
        scale: 1.28,
        rotation: 50,
        opacity: 0.98,
        duration: 3.2,
        ease: 'sine.inOut',
      })
      .to(orb3, {
        x: -95 * amp,
        y: -55 * amp,
        scale: 0.82,
        rotation: -40,
        opacity: 0.62,
        duration: 3.7,
        ease: 'sine.inOut',
      })
      .to(orb3, {
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
        opacity: 0.78,
        duration: 3.4,
        ease: 'sine.inOut',
      });
    });

    return () => {
      ctx.revert();
    };
  }, [hasSearched]);

  return (
    <MainWrapper ref={mainRef}>
      <JourneyAssemblyLoader />

      <Landing $centered={!hasSearched}>
        {/* 🟠 GSAP 100% 자동 유기적 유영 앰비언트 글로우 — 검색창 중심에 항상 앵커링 */}
        {!hasSearched && (
          <AmbientGlowLayer aria-hidden="true">
            <PrimaryGlowOrb ref={orb1Ref} />
            <SecondaryGlowOrb ref={orb2Ref} />
            <TertiaryGlowOrb ref={orb3Ref} />
          </AmbientGlowLayer>
        )}
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
