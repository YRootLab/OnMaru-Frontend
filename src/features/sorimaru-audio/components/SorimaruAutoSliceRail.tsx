'use client';

import React, { useMemo, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, ChevronRight } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok } from '@/design-system/tokens';

const INTRO_VIDEO_SRC = '/videos/hanok-neungsohwa-loop.mp4';

interface SorimaruAutoSliceRailProps {
  stories: SorimaruStoryItem[];
  storySets?: Record<string, SorimaruStoryItem[]>;
}

function getStoryLabel(story: SorimaruStoryItem): string {
  return story.locationName || (story.category !== '전체' ? story.category : '') || '대한민국 문화유산';
}

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(280px, 34vh, 360px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1120px) {
    margin: 0 16px;
  }

  @media (max-width: 640px) {
    margin: 0 8px;
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
`;

/* 흰 텍스트 대비 및 중앙 텍스트 가독성을 위한 시네마틱 스크림 */
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
  margin: 0 0 10px;
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
  margin: 0 0 22px;
  text-align: center;
  max-width: 680px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  white-space: nowrap;

  @media (max-width: 768px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const GlassPlayerBar = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 8px 16px 8px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  max-width: 90vw;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.35);
  }
`;

const PlayCircleButton = styled(motion.button)`
  display: flex;
  height: 42px;
  width: 42px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: #ffffff;
  color: ${meok[900]};
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, background-color 0.2s ease;

  &:hover {
    background-color: #f5f5f4;
  }
`;

const StoryInfoBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  min-width: 0;
`;

const PlayerBadge = styled.span`
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: ${palette.hwanggeum[200]};
  line-height: 1.2;
`;

const StoryTitleText = styled.span`
  font-family: var(--font-traditional-title);
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;

  @media (max-width: 520px) {
    max-width: 160px;
  }
`;

const StoryMetaText = styled.span`
  font-family: var(--font-traditional-body);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;

  @media (max-width: 520px) {
    max-width: 160px;
  }
`;

const NextTrackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 6px 12px;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.24);
    color: #ffffff;
  }

  @media (max-width: 520px) {
    display: none;
  }
`;

export const SorimaruAutoSliceRail: React.FC<SorimaruAutoSliceRailProps> = ({ stories, storySets }) => {
  const shouldReduceMotion = useReducedMotion();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoReady, setIntroVideoReady] = useState(false);

  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const timer = window.setTimeout(() => setShowIntroVideo(true), 1200);
    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  const featured = useMemo(() => {
    const recommended = storySets?.['추천'];
    return (recommended?.length ? recommended : stories).slice(0, 7);
  }, [stories, storySets]);

  if (featured.length === 0) return null;

  const story = featured[featuredIndex % featured.length];
  const isStoryPlaying = currentStory.stid === story.stid && isPlaying;

  const play = () => {
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <IntroStage aria-label="소리마루 오디오 히어로">
      <IntroPoster aria-hidden="true" $visible={!introVideoReady} />
      {showIntroVideo && (
        <IntroVideo
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
      <IntroContent>
        <PageTitle>한국의 장면을, 귀로 걷다</PageTitle>
        <Lead>
          사진보다 먼저 도착하는 소리로, 오래된 장소의 온기와 사람의 발자국을 들어보세요.
        </Lead>

        <GlassPlayerBar
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <PlayCircleButton
            type="button"
            onClick={play}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label={isStoryPlaying ? '잠시 멈추기' : '지금 듣기'}
          >
            <AnimatePresence initial={false} mode="wait">
              {isStoryPlaying ? (
                <motion.span
                  key="pause"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause size={18} strokeWidth={2.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="play"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play size={18} style={{ marginLeft: 2 }} fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </PlayCircleButton>

          <StoryInfoBox onClick={play}>
            <PlayerBadge>{isStoryPlaying ? '지금 재생 중' : '지금 듣는 이야기'}</PlayerBadge>
            <StoryTitleText>{story.title}</StoryTitleText>
            <StoryMetaText>
              {getStoryLabel(story)}
              {story.formattedDuration ? ` · ${story.formattedDuration}` : ''}
            </StoryMetaText>
          </StoryInfoBox>

          {featured.length > 1 && (
            <NextTrackButton
              type="button"
              onClick={() => setFeaturedIndex((index) => index + 1)}
              aria-label="다음 이야기로 넘기기"
            >
              <span>다음 이야기</span>
              <ChevronRight size={14} strokeWidth={2.2} />
            </NextTrackButton>
          )}
        </GlassPlayerBar>
      </IntroContent>
    </IntroStage>
  );
};
