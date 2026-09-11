'use client';

import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';

export function LandscapeCardVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="04"
      title="가로형 카드"
      description="이미지와 정보를 좌우로 배치한 구성"
      detail="포스터 비율에서 가장 크게 벗어난 안입니다. 세로 점유를 줄이는 대신 한 번에 보이는 카드 수를 낮추고, 제목과 부가 정보를 편하게 읽도록 구성했습니다."
    >
      <StudyRail className="gap-4 sm:gap-5">
        {stories.map((story) => (
          <MotionStudyCard
            key={story.id}
            className="group grid h-[196px] w-[310px] shrink-0 grid-cols-[44%_1fr] overflow-hidden rounded-[20px]  bg-[#fffdf9]  sm:h-[218px] sm:w-[370px] sm:rounded-[24px]"
          >
            <div className="relative overflow-hidden bg-[#ddd2c5]">
              <StudyImage
                story={story}
                sizes="(max-width: 640px) 137px, 163px"
                className="transition-transform duration-700 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04] motion-reduce:transition-none"
              />
              <span className="absolute left-3 top-3 rounded-full  bg-black/20 px-2 py-1 text-[8px] font-semibold text-white backdrop-blur-md">
                {story.category}
              </span>
            </div>
            <div className="flex min-w-0 flex-col p-4 sm:p-5">
              <p className="truncate text-[9px] text-[#8c7e6c]">{story.location}</p>
              <h3 className="mt-2 line-clamp-3 font-sorimaru-sans text-[17px] font-bold leading-[1.35] tracking-[-0.04em] text-[#211e19] sm:text-[19px]">
                {story.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#786d5e] sm:text-[10px]">{story.audioTitle}</p>
              <div className="mt-auto flex items-center justify-between gap-2   pt-3">
                <span className="text-[10px] font-semibold tabular-nums text-[#655b4d]">{story.duration}</span>
                <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
              </div>
            </div>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
