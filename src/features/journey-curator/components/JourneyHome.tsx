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
  mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
`;

/** GSAP 살아 숨쉬는 유기적 단청 주홍 & 금빛 앰비언트 오르브들 */
const GlowOrbBase = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
`;

const PrimaryGlowOrb = styled(GlowOrbBase)`
  top: 30vh;
  left: 50%;
  width: clamp(380px, 45vw, 680px);
  height: clamp(320px, 38vw, 560px);
  border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;

  /* 은은한 앰버-주홍 온기가 배경 전체로 포근하게 번지는 블렌딩 */
  background: radial-gradient(
    circle at 48% 45%,
    rgba(255, 120, 40, 0.18) 0%,
    rgba(255, 160, 60, 0.10) 35%,
    rgba(255, 200, 100, 0.04) 60%,
    rgba(255, 255, 255, 0) 80%
  );
  filter: blur(64px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 48% 45%,
      rgba(255, 130, 45, 0.22) 0%,
      rgba(250, 150, 65, 0.12) 35%,
      rgba(255, 185, 110, 0.05) 60%,
      rgba(28, 26, 23, 0) 80%
    );
    filter: blur(72px);
  }
`;

const SecondaryGlowOrb = styled(GlowOrbBase)`
  top: 32vh;
  left: 52%;
  width: clamp(320px, 38vw, 540px);
  height: clamp(300px, 35vw, 500px);
  border-radius: 55% 45% 60% 40% / 45% 55% 45% 55%;

  /* 황금 옐로우 빛이 주홍과 어우러져 아침 햇살처럼 은은하게 확장 */
  background: radial-gradient(
    circle at 52% 50%,
    rgba(255, 200, 70, 0.16) 0%,
    rgba(255, 215, 120, 0.08) 38%,
    rgba(255, 235, 170, 0.03) 65%,
    rgba(255, 255, 255, 0) 85%
  );
  filter: blur(56px);

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 52% 50%,
      rgba(255, 210, 85, 0.18) 0%,
      rgba(255, 220, 135, 0.09) 38%,
      rgba(255, 235, 175, 0.04) 65%,
      rgba(28, 26, 23, 0) 85%
    );
    filter: blur(64px);
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
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hasSearched) return;

    const orb1 = orb1Ref.current;
    const orb2 = orb2Ref.current;
    if (!orb1 || !orb2) return;

    // 오르브는 검색창 뒤에서 움직여야 하므로 위치는 검색창 중앙에 고정한다.
    // "카테고리를 넘으면 안 된다"는 위치 계산이 아니라 glowLayer 자체를 안전선
    // 높이로 물리적으로 잘라내는 것으로 전담한다 — vh 같은 뷰포트 단위는 flex
    // 중앙정렬 레이아웃과 어긋나기 쉬워 실제 DOM 위치를 직접 측정해서 쓴다.
    const CHIP_SAFE_GAP = 10;
    const positionOrbs = () => {
      const mainTop = mainRef.current?.getBoundingClientRect().top;
      const searchRect = searchFormRef.current?.getBoundingClientRect();
      if (mainTop === undefined || !searchRect) return;

      const chipsTop = moodChipsRef.current
        ? moodChipsRef.current.getBoundingClientRect().top - mainTop
        : searchRect.bottom - mainTop + 200;

      const safeBottom = Math.max(0, chipsTop - CHIP_SAFE_GAP);

      // 계산이 또 틀려도 이 밑으로는 물리적으로 그려질 수 없게 레이어 자체를 잘라낸다.
      if (glowLayerRef.current) {
        glowLayerRef.current.style.height = `${safeBottom}px`;
      }

      // "검색창 뒤에서" 움직이도록 오르브 중심을 검색창 세로 중앙에 그대로 맞춘다.
      // 예전엔 여기서 안전선과 다시 비교해(Math.min) 안전선을 넘을 것 같으면 오르브를
      // 위로 밀어 올렸는데, 검색창~카테고리 간격이 20px 안팎이라 오르브 절반 크기가
      // 그보다 훨씬 커서 거의 항상 밀려 올라갔다 — 그래서 계속 제목 뒤에 가 있었다.
      // 이제 안전선 준수는 위 물리적 클립(overflow: hidden)이 전담하므로, 위치 자체는
      // 검색창 중앙에 고정해도 된다.
      const searchCenter = (searchRect.top + searchRect.bottom) / 2 - mainTop;
      orb1.style.top = `${searchCenter}px`;
      orb2.style.top = `${searchCenter + 6}px`;
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
        y: '-=25',
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
        <AmbientGlowLayer ref={glowLayerRef} aria-hidden="true">
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
