'use client';

import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';
import type { OnmaruTheme } from '@/design-system/tokens';
import { InfoTag } from '@/design-system/components';

const EASE = [0.22, 1, 0.36, 1] as const;

const HeroContainer = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  z-index: 10;
  pointer-events: none;
`;

// 상단 가독성 확보용 그라데이션 오버레이 레이어
const TopGradientOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: clamp(240px, 38vh, 400px);
  background: linear-gradient(
    180deg,
    rgba(250, 248, 243, 0.95) 0%,
    rgba(250, 248, 243, 0.7) 50%,
    rgba(250, 248, 243, 0) 100%
  );
  pointer-events: none;
  z-index: 15;
`;

// 한지 질감 오버레이 — SVG feTurbulence 노이즈로 종이 섬유질 표현
const HANJI_NOISE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='h'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23h)' opacity='1'/%3E%3C/svg%3E`;

const HanjiTextureOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image: url("${HANJI_NOISE_SVG}");
  background-repeat: repeat;
  background-size: 400px 400px;
  opacity: 0.14;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 12;
`;

// 화면 중앙 상단 콘텐츠 패널 구성
const ContentPanel = styled.div`
  position: absolute;
  top: clamp(36px, 7.5vh, 76px);
  left: 50%;
  transform: translateX(-50%);
  width: min(90%, 1080px);
  padding: 0 ${({ theme }) => (theme as OnmaruTheme).spacing[6]};
  text-align: center;
  z-index: 20;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
`;

const MainTitle = styled(motion.h1)`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.traditional};
  font-size: clamp(28px, 5.5vw, 76px);
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  line-height: ${({ theme }) => (theme as OnmaruTheme).typography.lineHeight.tight};
  letter-spacing: -0.025em;
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.primary};
  margin: 0 0 ${({ theme }) => (theme as OnmaruTheme).spacing[3]};
  word-break: keep-all;
  white-space: normal;
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: clamp(22px, 6.5vw, 38px);
    margin-bottom: ${({ theme }) => (theme as OnmaruTheme).spacing[2]};
  }
`;

const Subtitle = styled(motion.p)`
  font-family: ${({ theme }) => (theme as OnmaruTheme).typography.fontFamily.sans};
  font-size: clamp(16px, 1.6vw, 22px);
  line-height: ${({ theme }) => (theme as OnmaruTheme).typography.lineHeight.normal};
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.regular};
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.secondary};
  margin: 0;
  max-width: 760px;
  letter-spacing: -0.015em;
  word-break: keep-all;

  @media (max-width: 768px) {
    font-size: 14.5px;
  }
`;

// 화면 좌측 하단 출처 표기 패널 구성
const CreditGroup = styled(motion.div)`
  position: absolute;
  bottom: clamp(28px, 4.5vh, 40px);
  left: clamp(24px, 5vw, 64px);
  z-index: 20;
  pointer-events: auto;

  @media (max-width: 768px) {
    left: 20px;
    bottom: 76px;
  }
`;

const StyledInfoTag = styled(InfoTag)`
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.muted};
  background: rgba(247, 245, 240, 0.75);
  backdrop-filter: blur(4px);
  border-color: ${({ theme }) => (theme as OnmaruTheme).colors.border.subtle};
  padding: ${({ theme }) => `${(theme as OnmaruTheme).spacing[1]} ${(theme as OnmaruTheme).spacing[3]}`};
  letter-spacing: -0.015em;
  white-space: nowrap;

  @media (max-width: 768px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

// 하단 중앙 스크롤 인디케이터 구성
const ScrollPrompt = styled(motion.div)`
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => (theme as OnmaruTheme).spacing[2]};
  font-size: 11px;
  font-weight: ${({ theme }) => (theme as OnmaruTheme).typography.fontWeight.bold};
  letter-spacing: 0.24em;
  color: ${({ theme }) => (theme as OnmaruTheme).colors.text.secondary};
  z-index: 25;
  pointer-events: none;
`;

const ScrollArrowIcon = styled(motion.svg)`
  width: 18px;
  height: 18px;
  fill: none;
  stroke: ${({ theme }) => (theme as OnmaruTheme).colors.badge.star};
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export default function HeroSection() {
  const isOrbitEnabled = useHanokViewerStore((s) => s.isOrbitEnabled);
  const isLoaded = useHanokViewerStore((s) => s.isLoaded);
  const isReducedMotion = useHanokViewerStore((s) => s.isReducedMotion);
  const setIsReducedMotion = useHanokViewerStore((s) => s.setIsReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [setIsReducedMotion]);

  const delayTitle = isReducedMotion ? 0 : 0.0;
  const delaySub = isReducedMotion ? 0 : 2.5;
  const delayCredit = isReducedMotion ? 0 : 3.5;
  const delayScroll = isReducedMotion ? 0 : 3.5;

  return (
    <HeroContainer>
      <HanjiTextureOverlay />
      <TopGradientOverlay />

      {/* 상단 중앙 대제목 및 부제 영역 */}
      <ContentPanel style={{ pointerEvents: isOrbitEnabled ? 'none' : 'auto' }}>
        <MainTitle
          initial={{ opacity: 0, y: isReducedMotion ? 0 : 24 }}
          animate={isLoaded || isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: isReducedMotion ? 0.2 : 0.7, ease: EASE, delay: delayTitle }}
        >
          한옥을 따라, 동네를 누비다
        </MainTitle>

        <Subtitle
          initial={{ opacity: 0, y: isReducedMotion ? 0 : 16 }}
          animate={isLoaded || isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: isReducedMotion ? 0.2 : 0.8, ease: EASE, delay: delaySub }}
        >
          길을 찾고, 듣고, 나누는 로컬 탐색 지도, 온마루
        </Subtitle>
      </ContentPanel>

      {/* 좌측 하단 출처 표기 영역 */}
      <CreditGroup
        initial={{ opacity: 0, y: isReducedMotion ? 0 : 14 }}
        animate={isLoaded || isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: isReducedMotion ? 0.2 : 0.8, ease: EASE, delay: delayCredit }}
        style={{ pointerEvents: isOrbitEnabled ? 'none' : 'auto' }}
      >
        <StyledInfoTag>
          서울 계동 근대 한옥 안채 · 국가유산청 3D 실측 데이터 · 공공누리 제1유형
        </StyledInfoTag>
      </CreditGroup>

      {/* 하단 중앙 스크롤 인디케이터 영역 */}
      <ScrollPrompt
        initial={{ opacity: 0 }}
        animate={isLoaded || isReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: isReducedMotion ? 0.2 : 0.8, delay: delayScroll }}
      >
        <span>SCROLL</span>
        <ScrollArrowIcon
          viewBox="0 0 24 24"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </ScrollArrowIcon>
      </ScrollPrompt>
    </HeroContainer>
  );
}
