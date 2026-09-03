'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';

export function CompactPosterVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  const reduceMotion = useReducedMotion();

  return (
    <StudySectionFrame
      number="01"
      title="낮은 포스터"
      description="높이와 내부 간격을 줄인 기본 개선안"
      detail="기존 포스터의 익숙한 흐름은 유지하고, 이미지 높이와 카드 내부 여백을 줄여 다음 콘텐츠까지의 이동을 빠르게 만든 안입니다."
    >
      <StudyRail className="gap-4 sm:gap-5">
        {stories.map((story) => (
          <MotionStudyCard
            key={story.id}
            className="group flex w-[196px] shrink-0 flex-col overflow-hidden rounded-[18px]  bg-[#fffdf9]  sm:w-[232px]"
          >
            <div className="relative h-[202px] overflow-hidden bg-[#ddd2c5] sm:h-[226px]">
              <StudyImage
                story={story}
                sizes="(max-width: 640px) 196px, 232px"
                className="transition-transform duration-700 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.035] motion-reduce:transition-none"
              />
              <span className="absolute left-3 top-3 rounded-full bg-[#fffdf9]/90 px-2.5 py-1 text-[9px] font-bold text-[#d94068]  backdrop-blur-sm">
                {story.category}
              </span>
            </div>
            <div className="flex min-h-[144px] flex-1 flex-col p-4">
              <p className="truncate text-[10px] text-[#8c7e6c]">{story.location}</p>
              <h3 className="mt-1.5 line-clamp-2 min-h-[2.7rem] font-odii-sans text-[16px] font-bold leading-[1.35] tracking-[-0.035em] text-[#211e19]">
                {story.title}
              </h3>
              <p className="mt-2 truncate text-[10px] text-[#786d5e]">{story.audioTitle}</p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                <span className="text-[10px] font-semibold tabular-nums text-[#655b4d]">{story.duration}</span>
                <motion.div animate={reduceMotion ? undefined : { scale: selectedStoryId === story.id ? [1, 1.06, 1] : 1 }}>
                  <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
                </motion.div>
              </div>
            </div>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
