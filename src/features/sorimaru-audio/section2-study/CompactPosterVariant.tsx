'use client';

import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';
import { palette, meok } from '@/design-system/tokens';

const CardItem = styled.div`
  display: flex;
  width: 196px;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background-color: #fffdf9;
  @media (min-width: 640px) {
    width: 232px;
  }

  &:hover .zoom-target {
    transform: scale(1.035);
  }
`;

const ImageArea = styled.div`
  position: relative;
  height: 202px;
  overflow: hidden;
  background-color: #ddd2c5;
  @media (min-width: 640px) {
    height: 226px;
  }

  .zoom-target {
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

const CategoryBadge = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  border-radius: 9999px;
  background-color: rgba(255, 253, 249, 0.9);
  padding: 0.25rem 0.625rem;
  font-size: 10px;
  font-weight: 700;
  color: ${palette.jangmi[700]};
  backdrop-filter: blur(4px);
`;

const BodyArea = styled.div`
  display: flex;
  min-height: 144px;
  flex: 1;
  flex-direction: column;
  padding: 1rem;
`;

const LocationText = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #8c7e6c;
`;

const TitleHeading = styled.h3`
  margin-top: 0.375rem;
  min-height: 2.7rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-hanok);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.035em;
  color: #211e19;
`;

const AudioTitleText = styled.p`
  margin-top: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #786d5e;
`;

const BottomRow = styled.div`
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1rem;
`;

const DurationText = styled.span`
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #655b4d;
`;

export function CompactPosterVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  const reduceMotion = useReducedMotion();

  return (
    <StudySectionFrame
      number="01"
      title="낮은 포스터"
      description="높이와 내부 간격을 줄인 기본 개선안"
      detail="기존 포스터의 익숙한 흐름은 유지하고, 이미지 높이와 카드 내부 여백을 줄여 다음 콘텐츠까지의 이동을 빠르게 만든 안입니다."
    >
      <StudyRail gap="1rem">
        {stories.map((story) => (
          <MotionStudyCard key={story.id}>
            <CardItem>
              <ImageArea>
                <StudyImage
                  story={story}
                  sizes="(max-width: 640px) 196px, 232px"
                  className="zoom-target"
                />
                <CategoryBadge>
                  {story.category}
                </CategoryBadge>
              </ImageArea>
              <BodyArea>
                <LocationText>{story.location}</LocationText>
                <TitleHeading>
                  {story.title}
                </TitleHeading>
                <AudioTitleText>{story.audioTitle}</AudioTitleText>
                <BottomRow>
                  <DurationText>{story.duration}</DurationText>
                  <motion.div animate={reduceMotion ? undefined : { scale: selectedStoryId === story.id ? [1, 1.06, 1] : 1 }}>
                    <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
                  </motion.div>
                </BottomRow>
              </BodyArea>
            </CardItem>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
