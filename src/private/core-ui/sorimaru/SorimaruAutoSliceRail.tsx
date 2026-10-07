'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useReducedMotion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, PauseIcon, HeadphonesIcon } from '@hugeicons/core-free-icons';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { meok, palette } from '@/design-system/tokens';

const INTRO_VIDEO_SRC = '/videos/Oni_sit_listen.mp4';

gsap.registerPlugin(ScrollTrigger);

interface SorimaruAutoSliceRailProps {
  stories?: SorimaruStorySummary[];
  storySets?: Record<string, SorimaruStorySummary[]>;
}

const eqAnimation = keyframes`
  0%, 100% { height: 4px; }
  50% { height: 16px; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 85, 0, 0.45); }
  50% { box-shadow: 0 0 0 8px rgba(255, 85, 0, 0); }
`;

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(460px, 56vh, 600px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    margin: 0 auto;
    min-height: clamp(400px, 50vh, 500px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    margin: 0 auto;
    border-radius: 18px;
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
    rgba(10, 9, 8, 0.82) 0%,
    rgba(10, 9, 8, 0.54) 45%,
    rgba(10, 9, 8, 0.16) 75%,
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
  margin: 0 0 22px;
  text-align: left;
  max-width: 580px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
  word-break: keep-all;

  @media (max-width: 768px) {
    margin-bottom: 18px;
  }
`;

const AudioActionArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const AudioGuideChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.75rem;
  letter-spacing: -0.01em;
  line-height: 1;

  > svg {
    color: ${palette.juhong[400]};
  }
`;

const SoundPlayCard = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px 10px 10px;
  border-radius: 9999px;
  background: rgba(18, 16, 14, 0.64);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.20);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.40);
  cursor: pointer;
  user-select: none;
  transition: all 220ms cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;

  &:hover {
    background: rgba(28, 24, 20, 0.80);
    border-color: rgba(255, 255, 255, 0.36);
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.50);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const PlayIconBubble = styled.div<{ $isPlaying: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: ${palette.juhong[500]};
  box-shadow: 0 4px 14px rgba(255, 85, 0, 0.45);
  animation: ${({ $isPlaying }) => ($isPlaying ? pulseGlow : 'none')} 2s infinite;
  flex-shrink: 0;
  transition: transform 180ms ease, background-color 180ms ease;

  button:hover & {
    transform: scale(1.05);
  }
`;

const PlayTextCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;

const PlayTitleText = styled.span`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 480px) {
    max-width: 170px;
  }
`;

const PlayStatusText = styled.span`
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EqualizerBox = styled.div`
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
  padding: 0 4px;
  flex-shrink: 0;
`;

const EqualizerBar = styled.span<{ $delay: number; $isPlaying: boolean }>`
  display: inline-block;
  width: 3px;
  border-radius: 2px;
  background-color: ${palette.juhong[400]};
  height: ${({ $isPlaying }) => ($isPlaying ? '14px' : '4px')};
  animation: ${({ $isPlaying }) => ($isPlaying ? eqAnimation : 'none')} 0.85s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  transition: height 0.25s ease;
`;

export const SorimaruAutoSliceRail: React.FC<SorimaruAutoSliceRailProps> = ({ stories }) => {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoReady, setIntroVideoReady] = useState(false);

  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const selectAndLoadStory = useSorimaruAudioStore((s) => s.selectAndLoadStory);

  const featuredStory = stories?.[0];

  const handleToggleSound = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentStory) {
      setIsPlaying(true);
      return;
    }
    if (featuredStory) {
      selectAndLoadStory(featuredStory, 'play');
    }
  };

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

        <AudioActionArea>
          <AudioGuideChip>
            <HugeiconsIcon icon={HeadphonesIcon} size={13} strokeWidth={2} />
            <span>3D 공간 음향 · 이어폰 착용 권장</span>
          </AudioGuideChip>

          <SoundPlayCard
            type="button"
            onClick={handleToggleSound}
            aria-label={isPlaying ? '소리 일시정지' : '소리 들어보기'}
          >
            <PlayIconBubble $isPlaying={isPlaying}>
              {isPlaying ? (
                <HugeiconsIcon icon={PauseIcon} size={18} strokeWidth={2.4} />
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </PlayIconBubble>

            <PlayTextCol>
              <PlayTitleText>
                {currentStory?.title ?? featuredStory?.title ?? '처마 끝을 스치는 바람과 풍경 소리'}
              </PlayTitleText>
              <PlayStatusText>
                {isPlaying ? '지금 소리마루 재생 중' : '터치하여 소리 들어보기'}
              </PlayStatusText>
            </PlayTextCol>

            <EqualizerBox aria-hidden="true">
              {[0, 0.18, 0.36, 0.54].map((delay, idx) => (
                <EqualizerBar key={idx} $delay={delay} $isPlaying={isPlaying} />
              ))}
            </EqualizerBox>
          </SoundPlayCard>
        </AudioActionArea>
      </IntroContent>
    </IntroStage>
  );
};
