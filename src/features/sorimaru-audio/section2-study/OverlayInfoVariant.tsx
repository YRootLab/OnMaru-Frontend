'use client';

import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';

export function OverlayInfoVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="02"
      title="정보 오버레이"
      description="정보 패널을 썸네일 안으로 올린 구성"
      detail="이미지의 몰입감은 유지하되 별도의 하단 카드 몸체를 없앴습니다. 정보는 반투명 패널 하나로 묶어 카드 전체 높이를 절약합니다."
    >
      <StudyRail className="gap-4 sm:gap-5">
        {stories.map((story) => (
          <MotionStudyCard
            key={story.id}
            className="group relative h-[354px] w-[218px] shrink-0 overflow-hidden rounded-[24px]  bg-[#ddd2c5]  sm:h-[402px] sm:w-[252px]"
          >
            <StudyImage
              story={story}
              sizes="(max-width: 640px) 218px, 252px"
              className="transition-transform duration-700 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04] motion-reduce:transition-none"
            />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" aria-hidden="true" />
            <span className="absolute left-4 top-4 rounded-full  bg-black/20 px-2.5 py-1 text-[9px] font-semibold text-white  backdrop-blur-md">
              {story.category}
            </span>
            <div className="absolute inset-x-3 bottom-3 rounded-[17px]  bg-[#fffdf9]/90 p-4  backdrop-blur-xl sm:inset-x-4 sm:bottom-4">
              <p className="truncate text-[9px] text-[#786d5e]">{story.location}</p>
              <h3 className="mt-1.5 line-clamp-2 min-h-[2.7rem] font-sorimaru-sans text-[16px] font-bold leading-[1.35] tracking-[-0.035em] text-[#211e19]">
                {story.title}
              </h3>
              <div className="mt-3 flex items-center justify-between gap-3   pt-3">
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-[#786d5e]">{story.audioTitle}</p>
                  <p className="mt-1 text-[10px] font-semibold tabular-nums text-[#655b4d]">{story.duration}</p>
                </div>
                <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
              </div>
            </div>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
