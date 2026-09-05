'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface OdiiAutoSliceRailProps {
  stories: OdiiStoryItem[];
  storySets?: Record<string, OdiiStoryItem[]>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function getStoryLabel(story: OdiiStoryItem): string {
  return story.locationName || (story.category !== '전체' ? story.category : '') || '대한민국 문화유산';
}

export const OdiiAutoSliceRail: React.FC<OdiiAutoSliceRailProps> = ({ stories, storySets }) => {
  const shouldReduceMotion = useReducedMotion();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

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
    <section aria-labelledby="odii-hero-heading" className="w-full pb-16 sm:pb-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-0">
        <div className="py-10 sm:py-14 lg:py-20">
          <div className="max-w-[720px]">
            <motion.h1
              id="odii-hero-heading"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease: EASE }}
              className="font-odii-sans text-[clamp(42px,7.2vw,94px)] font-bold leading-[0.98] tracking-normal text-[#171715]"
            >
              한국의 장면을,
              <br />
              <span className="text-[#F84E76]">귀로</span> 걷다.
            </motion.h1>
            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, ease: EASE, delay: 0.06 }}
              className="mt-5 max-w-[20rem] text-[15px] leading-7 text-[#655b4d] sm:max-w-xl sm:text-[17px]"
            >
              사진보다 먼저 도착하는 소리로, 오래된 장소의 온기와 사람의 발자국을 들어보세요.
            </motion.p>
          </div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: EASE, delay: 0.14 }}
            className="mt-10 flex items-center gap-5 sm:mt-14 sm:gap-6"
          >
            <div className="relative shrink-0">
              <motion.div
                aria-hidden="true"
                animate={
                  shouldReduceMotion
                    ? { opacity: isStoryPlaying ? 0.5 : 0 }
                    : { opacity: isStoryPlaying ? [0.35, 0.6, 0.35] : 0, scale: isStoryPlaying ? [1, 1.12, 1] : 1 }
                }
                transition={isStoryPlaying && !shouldReduceMotion ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
                className="pointer-events-none absolute inset-[-14px] rounded-full bg-[#F84E76] blur-2xl"
              />
              <motion.button
                type="button"
                onClick={play}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                aria-label={isStoryPlaying ? '잠시 멈추기' : '지금 듣기'}
                style={{ boxShadow: '0 18px 30px -12px rgba(23,21,21,0.45), inset 0 1px 0 rgba(255,255,255,0.08)' }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#171715] text-white transition-colors duration-300 hover:bg-[#2B2925] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76] sm:h-24 sm:w-24"
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
                      <Pause className="h-7 w-7" aria-hidden="true" fill="currentColor" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="play"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: EASE }}
                    >
                      <Play className="ml-0.5 h-7 w-7" aria-hidden="true" fill="currentColor" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={story.stid}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="min-w-0"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8176]">
                  {isStoryPlaying ? '지금 재생 중' : '지금 듣는 이야기'}
                </p>
                <p className="mt-1 truncate font-odii-sans text-lg font-bold leading-6 text-[#211e19] sm:text-xl">
                  {story.title}
                </p>
                <p className="mt-1 truncate text-xs text-[#8A8176]">
                  {getStoryLabel(story)}
                  {story.formattedDuration ? ` · ${story.formattedDuration}` : ''}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {featured.length > 1 && (
            <motion.button
              type="button"
              onClick={() => setFeaturedIndex((index) => index + 1)}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 text-xs font-semibold text-[#8A8176] transition-colors duration-300 hover:text-[#F84E76] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76] sm:mt-14"
            >
              이번 주 인기 이야기 다음으로 ›
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
};
