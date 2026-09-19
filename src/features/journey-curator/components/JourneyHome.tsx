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
const AmbientGlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  mask-image: radial-gradient(circle at 50% 35%, black 20%, rgba(0, 0, 0, 0.6) 60%, transparent 85%);
  -webkit-mask-image: radial-gradient(circle at 50% 35%, black 20%, rgba(0, 0, 0, 0.6) 60%, transparent 85%);
`;

/** GSAP 살아 숨쉬는 유기적 단청 주홍 & 황금빛 앰비언트 오르브들 */
const GlowOrbBase = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

const PrimaryGlowOrb = styled(GlowOrbBase)`
  top: 36vh;
  left: 48%;
  width: clamp(340px, 42vw, 620px);
  height: clamp(300px, 36vw, 540px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;

  /* 은은하고 생동감 있는 단청 주홍 코어 */
  background: radial-gradient(
    circle at 45% 45%,
    rgba(255, 100, 25, 0.28) 0%,
    rgba(255, 145, 55, 0.16) 38%,
    rgba(255, 195, 95, 0.06) 65%,
    rgba(255, 255, 255, 0) 82%
  );
  filter: blur(52px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 45% 45%,
      rgba(255, 115, 35, 0.32) 0%,
      rgba(250, 155, 65, 0.18) 38%,
      rgba(255, 185, 110, 0.07) 65%,
      rgba(28, 26, 23, 0) 82%
    );
    filter: blur(60px);
  }
`;

const SecondaryGlowOrb = styled(GlowOrbBase)`
  top: 38vh;
  left: 53%;
  width: clamp(300px, 36vw, 520px);
  height: clamp(280px, 34vw, 480px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;

  /* 부드러운 황금 옐로우 확산 오라 */
  background: radial-gradient(
    circle at 55% 50%,
    rgba(255, 205, 60, 0.24) 0%,
    rgba(255, 220, 115, 0.12) 40%,
    rgba(255, 240, 165, 0.04) 68%,
    rgba(255, 255, 255, 0) 85%
  );
  filter: blur(48px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 55% 50%,
      rgba(255, 215, 80, 0.26) 0%,
      rgba(255, 225, 130, 0.14) 40%,
      rgba(255, 240, 170, 0.05) 68%,
      rgba(28, 26, 23, 0) 85%
    );
    filter: blur(56px);
  }
`;

const TertiaryGlowOrb = styled(GlowOrbBase)`
  top: 34vh;
  left: 50%;
  width: clamp(260px, 30vw, 440px);
  height: clamp(240px, 28vw, 400px);
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;

  /* 앰버 코랄 웜 하이라이트 */
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 155, 50, 0.20) 0%,
    rgba(255, 185, 90, 0.09) 45%,
    rgba(255, 255, 255, 0) 78%
  );
  filter: blur(44px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 165, 60, 0.24) 0%,
      rgba(255, 195, 105, 0.11) 45%,
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
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hasSearched) return;

    const orb1 = orb1Ref.current;
    const orb2 = orb2Ref.current;
    const orb3 = orb3Ref.current;
    if (!orb1 || !orb2 || !orb3) return;

    const ctx = gsap.context(() => {
      // 초기 세팅 (중심 기준점 정렬)
      gsap.set([orb1, orb2, orb3], {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: '50% 50%',
      });

      // 🌟 [Orb 1: 단청 주홍 메인 오르브] - 8자 형태의 유기적 유영 + 볼륨 호흡 모션
      gsap.to(orb1, {
        scale: 1.14,
        opacity: 0.95,
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        x: '+=120',
        duration: 4.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        y: '-=70',
        duration: 3.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        rotation: -45,
        duration: 9.0,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // 🌟 [Orb 2: 황금빛 옐로우 보조 오르브] - 반대 궤적으로 교차 유영
      gsap.to(orb2, {
        scale: 0.88,
        opacity: 0.92,
        duration: 3.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        x: '-=110',
        duration: 4.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        y: '+=60',
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        rotation: 50,
        duration: 10.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // 🌟 [Orb 3: 앰버 코랄 웜 하이라이트 오르브] - 중앙에서 미세하게 파동
      gsap.to(orb3, {
        scale: 1.2,
        opacity: 0.85,
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb3, {
        x: '+=60',
        y: '+=40',
        duration: 3.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // 🎯 마우스 인터랙티브 패럴랙스 (데스크톱 마우스 이동에 반응)
      const xSet1 = gsap.quickTo(orb1, 'x', { duration: 1.2, ease: 'power2.out' });
      const ySet1 = gsap.quickTo(orb1, 'y', { duration: 1.2, ease: 'power2.out' });
      const xSet2 = gsap.quickTo(orb2, 'x', { duration: 1.6, ease: 'power2.out' });
      const ySet2 = gsap.quickTo(orb2, 'y', { duration: 1.6, ease: 'power2.out' });
      const xSet3 = gsap.quickTo(orb3, 'x', { duration: 2.0, ease: 'power2.out' });
      const ySet3 = gsap.quickTo(orb3, 'y', { duration: 2.0, ease: 'power2.out' });

      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (clientX - centerX) / centerX;
        const deltaY = (clientY - centerY) / centerY;

        // 마우스 움직임에 따라 오르브들이 부드러운 3차원 깊이감으로 반응
        xSet1(deltaX * 45);
        ySet1(deltaY * 30);
        xSet2(deltaX * -35);
        ySet2(deltaY * -25);
        xSet3(deltaX * 20);
        ySet3(deltaY * 15);
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    });

    return () => {
      ctx.revert();
    };
  }, [hasSearched]);

  return (
    <MainWrapper ref={mainRef}>
      {/* 🟠 검색 전에만 작동하는 인터랙티브 생동감 앰비언트 그라데이션 */}
      {!hasSearched && (
        <AmbientGlowLayer ref={glowLayerRef} aria-hidden="true">
          <PrimaryGlowOrb ref={orb1Ref} />
          <SecondaryGlowOrb ref={orb2Ref} />
          <TertiaryGlowOrb ref={orb3Ref} />
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
