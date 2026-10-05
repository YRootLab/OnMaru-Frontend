'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useReducedMotion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { meok } from '@/design-system/tokens';

const INTRO_VIDEO_SRC = '/videos/Oni_sit_listen.mp4';

gsap.registerPlugin(ScrollTrigger);

interface SorimaruAutoSliceRailProps {
  stories?: SorimaruStorySummary[];
  storySets?: Record<string, SorimaruStorySummary[]>;
}

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(440px, 54vh, 580px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    margin: 0 auto;
    min-height: clamp(380px, 48vh, 480px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    margin: 0 auto;
    border-radius: 18px;
    min-height: 340px;
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
  background: linear-gradient(
    135deg,
    rgba(10, 9, 8, 0.72) 0%,
    rgba(10, 9, 8, 0.46) 45%,
    rgba(10, 9, 8, 0.12) 80%,
    rgba(10, 9, 8, 0.28) 100%
  );
`;

const IntroContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  padding: clamp(36px, 5.5vh, 52px) clamp(28px, 4.5vw, 56px);
`;

const PageTitle = styled.h1`
  font-family: 'Dohyun', var(--font-dohyun), var(--font-traditional-title), sans-serif;
  font-size: clamp(1.65rem, 3.2vw, 2.75rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 12px;
  text-align: left;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.75);
  white-space: nowrap;

  @media (max-width: 640px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const Lead = styled.p`
  font-family: var(--font-traditional-body);
  font-size: clamp(0.875rem, 1.15vw, 1.05rem);
  font-weight: 400;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  text-align: left;
  max-width: none;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
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
    setShowIntroVideo(true);
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
          preload="auto"
          $visible={introVideoReady}
          onLoadedData={() => setIntroVideoReady(true)}
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
