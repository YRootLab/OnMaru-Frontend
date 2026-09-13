'use client';

import styled from '@emotion/styled';
import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';
import { palette, meok } from '@/design-system/tokens';

const CardItem = styled.div`
  width: 206px;
  flex-shrink: 0;
  @media (min-width: 640px) {
    width: 244px;
  }

  &:hover .zoom-target {
    transform: scale(1.035);
  }
`;

const ImageArea = styled.div`
  position: relative;
  height: 244px;
  overflow: hidden;
  border-radius: 16px;
  background-color: #ddd2c5;
  @media (min-width: 640px) {
    height: 286px;
    border-radius: 20px;
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

  [data-theme='dark'] & {
    background-color: rgba(28, 26, 23, 0.85);
    color: ${palette.jangmi[400]};
  }
`;

const PlayControlSlot = styled.div`
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
`;

const CaptionArea = styled.div`
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-top: 1rem;
`;

const LocationText = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #8c7e6c;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const TitleHeading = styled.h3`
  margin-top: 0.375rem;
  min-height: 2.85rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-hanok);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.04em;
  color: #211e19;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const SubRow = styled.div`
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.75rem;
`;

const AudioTitle = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #786d5e;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const DurationText = styled.span`
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${palette.jangmi[700]};

  [data-theme='dark'] & {
    color: ${palette.jangmi[400]};
  }
`;

export function EditorialCaptionVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="03"
      title="분리형 캡션"
      description="이미지와 캡션의 프레임을 분리한 구성"
      detail="그림에만 입체감을 주고 텍스트는 배경 위에 직접 놓았습니다. 카드 덩어리감이 줄어들어 사진집을 넘기는 듯한 에디토리얼 리듬이 생깁니다."
    >
      <StudyRail gap="1.5rem">
        {stories.map((story) => (
          <MotionStudyCard key={story.id}>
            <CardItem>
              <ImageArea>
                <StudyImage
                  story={story}
                  sizes="(max-width: 640px) 206px, 244px"
                  className="zoom-target"
                />
                <CategoryBadge>
                  {story.category}
                </CategoryBadge>
                <PlayControlSlot>
                  <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
                </PlayControlSlot>
              </ImageArea>
              <CaptionArea>
                <LocationText>{story.location}</LocationText>
                <TitleHeading>
                  {story.title}
                </TitleHeading>
                <SubRow>
                  <AudioTitle>{story.audioTitle}</AudioTitle>
                  <DurationText>{story.duration}</DurationText>
                </SubRow>
              </CaptionArea>
            </CardItem>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
