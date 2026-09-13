'use client';

import styled from '@emotion/styled';
import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';
import { meok, surface } from '@/design-system/tokens';

const CardItem = styled.div`
  display: grid;
  height: 196px;
  width: 310px;
  flex-shrink: 0;
  grid-template-columns: 44% 1fr;
  overflow: hidden;
  border-radius: 20px;
  background-color: #fffdf9;
  @media (min-width: 640px) {
    height: 218px;
    width: 370px;
    border-radius: 24px;
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  &:hover .zoom-target {
    transform: scale(1.04);
  }
`;

const ImageArea = styled.div`
  position: relative;
  overflow: hidden;
  background-color: #ddd2c5;

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
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  backdrop-filter: blur(12px);
`;

const ContentArea = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 1rem;
  @media (min-width: 640px) {
    padding: 1.25rem;
  }
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
  margin-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-hanok);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.04em;
  color: #211e19;
  @media (min-width: 640px) {
    font-size: 18px;
  }

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const AudioTitle = styled.p`
  margin-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 10px;
  line-height: 1rem;
  color: #786d5e;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const FooterRow = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.75rem;
`;

const DurationText = styled.span`
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #655b4d;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export function LandscapeCardVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="04"
      title="가로형 카드"
      description="이미지와 정보를 좌우로 배치한 구성"
      detail="포스터 비율에서 가장 크게 벗어난 안입니다. 세로 점유를 줄이는 대신 한 번에 보이는 카드 수를 낮추고, 제목과 부가 정보를 편하게 읽도록 구성했습니다."
    >
      <StudyRail gap="1rem">
        {stories.map((story) => (
          <MotionStudyCard key={story.id}>
            <CardItem>
              <ImageArea>
                <StudyImage
                  story={story}
                  sizes="(max-width: 640px) 137px, 163px"
                  className="zoom-target"
                />
                <CategoryBadge>
                  {story.category}
                </CategoryBadge>
              </ImageArea>
              <ContentArea>
                <LocationText>{story.location}</LocationText>
                <TitleHeading>
                  {story.title}
                </TitleHeading>
                <AudioTitle>{story.audioTitle}</AudioTitle>
                <FooterRow>
                  <DurationText>{story.duration}</DurationText>
                  <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
                </FooterRow>
              </ContentArea>
            </CardItem>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
