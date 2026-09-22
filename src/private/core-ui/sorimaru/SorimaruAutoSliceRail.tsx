'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useReducedMotion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { meok } from '@/design-system/tokens';

const INTRO_VIDEO_SRC = '/videos/hanok-neungsohwa-loop.mp4';

gsap.registerPlugin(ScrollTrigger);

interface SorimaruAutoSliceRailProps {
  stories?: SorimaruStoryItem[];
  storySets?: Record<string, SorimaruStoryItem[]>;
}

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(280px, 34vh, 360px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    margin: 0 auto;
    border-radius: 18px;
    min-height: 250px;
  }
`;

const IntroPoster = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(135deg, ${meok[900]} 0%, #201c18 50%, ${meok[700]} 100%);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease;
  will-change: transform;
`;

const IntroVideo = styled.video<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease;
  will-change: transform;
`;


const IntroScrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    rgba(10, 9, 8, 0.58) 0%,
    rgba(10, 9, 8, 0.42) 60%,
    rgba(10, 9, 8, 0.78) 100%
  );
`;

const IntroContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(36px, 5vh, 52px) clamp(20px, 4vw, 40px);
`;

const PageTitle = styled.h1`
  font-family: var(--font-traditional-title);
  font-size: clamp(1.65rem, 3.2vw, 2.75rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 12px;
  text-align: center;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
  white-space: nowrap;

  @media (max-width: 640px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const Lead = styled.p`
  font-family: var(--font-traditional-body);
  font-size: clamp(0.875rem, 1.2vw, 1.05rem);
  font-weight: 400;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-align: center;
  max-width: 680px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  white-space: nowrap;

  @media (max-width: 768px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

export const SorimaruAutoSliceRail: React.FC<SorimaruAutoSliceRailProps> = () => {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoReady, setIntroVideoReady] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const timer = window.setTimeout(() => setShowIntroVideo(true), 1200);
    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  useGSAP(() => {
    if (shouldReduceMotion) return;
    const media = stageRef.current?.querySelectorAll('.sorimaru-hero-media');
    if (!media?.length) return;

    gsap.fromTo(media, { scale: 1.045, yPercent: -1.5 }, {
      scale: 1,
      yPercent: 2.5,
      ease: 'none',
      scrollTrigger: { trigger: stageRef.current, start: 'top bottom', end: 'bottom top', scrub: 1.4 },
    });
    gsap.fromTo(contentRef.current, { opacity: 0, filter: 'blur(10px)', y: 8 }, {
      opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.05, ease: 'power2.out',
    });
  }, { scope: stageRef, dependencies: [shouldReduceMotion, showIntroVideo] });

  return (
    <IntroStage ref={stageRef} aria-label="소리마루 오디오 히어로">
      <IntroPoster className="sorimaru-hero-media" aria-hidden="true" $visible={!introVideoReady} />
      {showIntroVideo && (
        <IntroVideo
          className="sorimaru-hero-media"
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          $visible={introVideoReady}
          onCanPlay={() => setIntroVideoReady(true)}
        >
          <source src={INTRO_VIDEO_SRC} type="video/mp4" />
        </IntroVideo>
      )}
      <IntroScrim aria-hidden="true" />
      <IntroContent ref={contentRef}>
        <PageTitle>한옥의 숨결을, 귀로 걷다</PageTitle>
        <Lead>
          처마 끝 풍경 소리부터 고즈넉한 대청마루까지, 전통 한옥과 오래된 공간의 온기를 들어보세요.
        </Lead>
      </IntroContent>
    </IntroStage>
  );
};
