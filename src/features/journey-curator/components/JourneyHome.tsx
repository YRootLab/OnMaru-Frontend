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

const AmbientGlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

/** GSAP 살아 숨쉬는 유기적 단청 주홍 & 금빛 앰비언트 오르브들 */
const GlowOrbBase = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

const PrimaryGlowOrb = styled(GlowOrbBase)`
  top: 32vh;
  left: 48%;
  width: clamp(200px, 26vw, 340px);
  height: clamp(190px, 24vw, 320px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;

  /* 살짝 진한 주황 — 아래 SecondaryGlowOrb의 옅은 주황과 겹쳐 섞인다 */
  background: radial-gradient(
    circle at 45% 45%,
    rgba(255, 110, 20, 0.38) 0%,
    rgba(255, 150, 60, 0.20) 40%,
    rgba(255, 190, 120, 0.09) 62%,
    rgba(255, 255, 255, 0) 78%
  );
  filter: blur(28px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 45% 45%,
      rgba(255, 120, 30, 0.42) 0%,
      rgba(255, 160, 70, 0.24) 40%,
      rgba(255, 200, 130, 0.11) 62%,
      rgba(28, 26, 23, 0) 78%
    );
    filter: blur(32px);
  }
`;

const SecondaryGlowOrb = styled(GlowOrbBase)`
  top: 33vh;
  left: 54%;
  width: clamp(160px, 20vw, 260px);
  height: clamp(150px, 22vw, 280px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;

  /* 은은하고 옅은 주황 — 위 PrimaryGlowOrb의 진한 주황과 겹쳐 섞인다 */
  background: radial-gradient(
    circle at 55% 50%,
    rgba(255, 175, 90, 0.26) 0%,
    rgba(255, 195, 130, 0.15) 38%,
    rgba(255, 215, 160, 0.07) 65%,
    rgba(255, 255, 255, 0) 80%
  );
  filter: blur(24px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 55% 50%,
      rgba(255, 185, 100, 0.30) 0%,
      rgba(255, 200, 140, 0.18) 38%,
      rgba(255, 220, 165, 0.08) 65%,
      rgba(28, 26, 23, 0) 80%
    );
    filter: blur(28px);
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
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hasSearched) return;

    const orb1 = orb1Ref.current;
    const orb2 = orb2Ref.current;
    if (!orb1 || !orb2) return;

    // 검색창 바로 위 카테고리 칩까지 여백이 20px 안팎이라 그라데이션을 검색창 중앙에 맞추면
    // 절반도 못 그리고 잘린다. 대신 "카테고리 칩 위 안전선"을 하한으로 잡고, 그 하한에
    // 오브의 아래쪽 끝이 딱 맞닿도록(=최대한 아래로) 배치한다. vh 같은 뷰포트 단위는
    // flex 중앙정렬 레이아웃과 어긋나기 쉬워 실제 DOM 위치를 직접 측정해서 쓴다.
    const CHIP_SAFE_GAP = 22;
    const positionOrbs = () => {
      const mainTop = mainRef.current?.getBoundingClientRect().top;
      const searchRect = searchFormRef.current?.getBoundingClientRect();
      if (mainTop === undefined || !searchRect) return;

      const chipsTop = moodChipsRef.current
        ? moodChipsRef.current.getBoundingClientRect().top - mainTop
        : searchRect.bottom - mainTop + 200;

      // 그라데이션은 62% 지점부터 이미 거의 안 보이고 78%부터 완전히 투명해서,
      // 요소의 실제 박스 절반 높이가 아니라 "눈에 보이는" 반경만 침범 여부를 따지면 된다.
      const VISIBLE_FRACTION = 0.68;
      const safeBottom = chipsTop - CHIP_SAFE_GAP;
      const orb1MaxHalf = ((orb1.offsetHeight * 1.08) / 2) * VISIBLE_FRACTION;
      const orb2MaxHalf = ((orb2.offsetHeight * 0.95) / 2) * VISIBLE_FRACTION;

      orb1.style.top = `${safeBottom - orb1MaxHalf}px`;
      orb2.style.top = `${safeBottom - orb2MaxHalf + 10}px`;
    };

    positionOrbs();
    window.addEventListener('resize', positionOrbs);

    const ctx = gsap.context(() => {
      // 🌟 [Orb 1: 단청 주홍 메인 오르브] - 8자 형태의 유기적 유영 + 볼륨 호흡 모션
      gsap.set(orb1, { xPercent: -50, yPercent: -50, scale: 0.95, opacity: 0.75 });

      gsap.to(orb1, {
        scale: 1.08,
        opacity: 0.98,
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        x: '+=110',
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        y: '-=85',
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb1, {
        rotation: -35,
        duration: 8.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // 🌟 [Orb 2: 금빛 주홍 보조 오르브] - Orb 1과 반대 위상으로 교차하며 은은한 오로라 파동 생성
      gsap.set(orb2, { xPercent: -50, yPercent: -50, scale: 0.95, opacity: 0.70 });

      gsap.to(orb2, {
        scale: 0.85,
        opacity: 0.92,
        duration: 3.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        x: '-=95',
        duration: 3.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        y: '+=25',
        duration: 3.0,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to(orb2, {
        rotation: 40,
        duration: 9.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

    return () => {
      window.removeEventListener('resize', positionOrbs);
      ctx.revert();
    };
  }, [hasSearched]);

  return (
    <MainWrapper ref={mainRef}>
      {/* 🟠 검색 전에만 작동하는 눈이 편안하며 생동감 넘치는 교차 유영 앰비언트 그라데이션 */}
      {!hasSearched && (
        <AmbientGlowLayer aria-hidden="true">
          <PrimaryGlowOrb ref={orb1Ref} />
          <SecondaryGlowOrb ref={orb2Ref} />
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
