'use client';

import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';

export function EditorialCaptionVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="03"
      title="분리형 캡션"
      description="이미지와 캡션의 프레임을 분리한 구성"
      detail="그림에만 입체감을 주고 텍스트는 배경 위에 직접 놓았습니다. 카드 덩어리감이 줄어들어 사진집을 넘기는 듯한 에디토리얼 리듬이 생깁니다."
    >
      <StudyRail className="gap-6 sm:gap-8">
        {stories.map((story) => (
          <MotionStudyCard key={story.id} className="group w-[206px] shrink-0 sm:w-[244px]">
            <div className="relative h-[244px] overflow-hidden rounded-[16px]  bg-[#ddd2c5]  sm:h-[286px] sm:rounded-[20px]">
              <StudyImage
                story={story}
                sizes="(max-width: 640px) 206px, 244px"
                className="transition-transform duration-700 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.035] motion-reduce:transition-none"
              />
              <span className="absolute left-3 top-3 rounded-full bg-[#fffdf9]/90 px-2.5 py-1 text-[9px] font-bold text-[#d94068]  backdrop-blur-sm">
                {story.category}
              </span>
              <div className="absolute bottom-3 right-3">
                <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
              </div>
            </div>
            <div className="px-1 pt-4">
              <p className="truncate text-[10px] text-[#8c7e6c]">{story.location}</p>
              <h3 className="mt-1.5 line-clamp-2 min-h-[2.85rem] font-sorimaru-sans text-[17px] font-bold leading-[1.35] tracking-[-0.04em] text-[#211e19]">
                {story.title}
              </h3>
              <div className="mt-3 flex items-center justify-between gap-3   pt-3">
                <p className="truncate text-[10px] text-[#786d5e]">{story.audioTitle}</p>
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#d94068]">{story.duration}</span>
              </div>
            </div>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
