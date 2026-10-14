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
  width: 100%;
  margin: 0;
  border-radius: 0;
  min-height: clamp(460px, 56vh, 600px);

  /* 양옆 페이드 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.75) 0%,
      rgba(255, 255, 255, 0.2) 8%,
      transparent 18%,
      transparent 82%,
      rgba(255, 255, 255, 0.2) 92%,
      rgba(255, 255, 255, 0.75) 100%
    );
  }

  [data-theme='dark'] &::before {
    background: linear-gradient(
      to right,
      rgba(11, 18, 32, 0.88) 0%,
      rgba(11, 18, 32, 0.3) 8%,
      transparent 18%,
      transparent 82%,
      rgba(11, 18, 32, 0.3) 92%,
      rgba(11, 18, 32, 0.88) 100%
    );
  }

  @media (max-width: 1024px) {
    min-height: clamp(400px, 50vh, 500px);
  }

  @media (max-width: 640px) {
    min-height: 380px;
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
    rgba(10, 9, 8, 0.35) 0%,
    rgba(10, 9, 8, 0.15) 50%,
    rgba(10, 9, 8, 0.08) 100%
  );
`;

export const SorimaruAutoSliceRail: React.FC<SorimaruAutoSliceRailProps> = () => {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
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
    </IntroStage>
  );
};
