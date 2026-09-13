'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, ChevronRight } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok } from '@/design-system/tokens';

interface SorimaruAutoSliceRailProps {
  stories: SorimaruStoryItem[];
  storySets?: Record<string, SorimaruStoryItem[]>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function getStoryLabel(story: SorimaruStoryItem): string {
  return story.locationName || (story.category !== '전체' ? story.category : '') || '대한민국 문화유산';
}

const SectionRoot = styled.section`
  width: 100%;
  padding-bottom: 4rem;

  @media (min-width: 640px) {
    padding-bottom: 5rem;
  }
`;

const SectionContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 72rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;

  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding-left: 0;
    padding-right: 0;
  }
`;

const HeroBody = styled.div`
  padding: 2.5rem 0;

  @media (min-width: 640px) {
    padding: 3.5rem 0;
  }
  @media (min-width: 1024px) {
    padding: 5rem 0;
  }
`;

const HeroHeading = styled(motion.h1)`
  font-family: var(--font-hanok);
  font-size: clamp(42px, 7.2vw, 94px);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: normal;
  color: ${meok[900]};

  span.accent {
    color: ${palette.jangmi[500]};
  }
`;

const HeroDesc = styled(motion.p)`
  margin-top: 1.25rem;
  max-width: 20rem;
  font-size: 0.875rem;
  line-height: 1.75rem;
  color: ${meok[700]};

  @media (min-width: 640px) {
    max-width: 36rem;
    font-size: 1rem;
  }
`;

const ControlsRow = styled(motion.div)`
  margin-top: 2.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;

  @media (min-width: 640px) {
    margin-top: 3.5rem;
    gap: 1.5rem;
  }
`;

const MainPlayCircle = styled(motion.button)`
  position: relative;
  display: flex;
  height: 5rem;
  width: 5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${meok[900]};
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 18px 30px -12px rgba(23, 21, 21, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2B2925;
  }
  &:focus-visible {
    outline: 2px solid ${palette.jangmi[500]};
    outline-offset: 4px;
  }

  @media (min-width: 640px) {
    height: 6rem;
    width: 6rem;
  }
`;

const GlowRing = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  inset: -14px;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  filter: blur(24px);
`;

const NextPopularButton = styled(motion.button)`
  margin-top: 2.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${meok[500]};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: ${palette.jangmi[500]};
  }

  @media (min-width: 640px) {
    margin-top: 3.5rem;
  }
`;

export const SorimaruAutoSliceRail: React.FC<SorimaruAutoSliceRailProps> = ({ stories, storySets }) => {
  const shouldReduceMotion = useReducedMotion();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

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
    <SectionRoot aria-labelledby="sorimaru-hero-heading">
      <SectionContainer>
        <HeroBody>
          <div style={{ maxWidth: 720 }}>
            <HeroHeading
              id="sorimaru-hero-heading"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease: EASE }}
            >
              한국의 장면을,
              <br />
              <span className="accent">귀로</span> 걷다.
            </HeroHeading>
            <HeroDesc
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease: EASE, delay: 0.06 }}
            >
              사진보다 먼저 도착하는 소리로, 오래된 장소의 온기와 사람의 발자국을 들어보세요.
            </HeroDesc>
          </div>

          <ControlsRow
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: EASE, delay: 0.14 }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <GlowRing
                aria-hidden="true"
                animate={
                  shouldReduceMotion
                    ? { opacity: isStoryPlaying ? 0.5 : 0 }
                    : { opacity: isStoryPlaying ? [0.35, 0.6, 0.35] : 0, scale: isStoryPlaying ? [1, 1.12, 1] : 1 }
                }
                transition={isStoryPlaying && !shouldReduceMotion ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
              />
              <MainPlayCircle
                type="button"
                onClick={play}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                aria-label={isStoryPlaying ? '잠시 멈추기' : '지금 듣기'}
              >
                <AnimatePresence initial={false} mode="wait">
                  {isStoryPlaying ? (
                    <motion.span
                      key="pause"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: EASE }}
                    >
                      <Pause style={{ height: '1.75rem', width: '1.75rem' }} strokeWidth={2} aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="play"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: EASE }}
                    >
                      <Play style={{ marginLeft: 2, height: '1.75rem', width: '1.75rem' }} fill="currentColor" aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </MainPlayCircle>
            </div>

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={story.stid}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: EASE }}
                style={{ minWidth: 0 }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: meok[500] }}>
                  {isStoryPlaying ? '지금 재생 중' : '지금 듣는 이야기'}
                </p>
                <p style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-hanok)', fontSize: '1.125rem', fontWeight: 700, lineHeight: '1.5rem', color: meok[900] }}>
                  {story.title}
                </p>
                <p style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: meok[500] }}>
                  {getStoryLabel(story)}
                  {story.formattedDuration ? ` · ${story.formattedDuration}` : ''}
                </p>
              </motion.div>
            </AnimatePresence>
          </ControlsRow>

          {featured.length > 1 && (
            <NextPopularButton
              type="button"
              onClick={() => setFeaturedIndex((index) => index + 1)}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span>이번 주 인기 이야기 다음으로</span>
              <ChevronRight size={13} strokeWidth={2} />
            </NextPopularButton>
          )}
        </HeroBody>
      </SectionContainer>
    </SectionRoot>
  );
};
