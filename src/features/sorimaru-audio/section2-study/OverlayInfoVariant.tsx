'use client';

import styled from '@emotion/styled';
import { MotionStudyCard, StudyImage, StudyPlayControl, StudyRail, StudySectionFrame, StudyVariantProps } from './StudyPrimitives';

import { meok, surface } from '@/design-system/tokens';

const CardItem = styled.div`
  position: relative;
  height: 354px;
  width: 218px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 24px;
  background-color: #ddd2c5;
  @media (min-width: 640px) {
    height: 402px;
    width: 252px;
  }

  &:hover .zoom-target {
    transform: scale(1.04);
  }

  .zoom-target {
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

const TopScrim = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 8rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent);
  pointer-events: none;
`;

const CategoryBadge = styled.span`
  position: absolute;
  left: 1rem;
  top: 1rem;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.625rem;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  backdrop-filter: blur(12px);
`;

const OverlayPanel = styled.div`
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  border-radius: 17px;
  background-color: rgba(255, 253, 249, 0.9);
  padding: 1rem;
  backdrop-filter: blur(24px);
  @media (min-width: 640px) {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  [data-theme='dark'] & {
    background-color: rgba(28, 26, 23, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const LocationText = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #786d5e;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
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

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const FooterRow = styled.div`
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

const DurationText = styled.p`
  margin-top: 0.25rem;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #655b4d;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export function OverlayInfoVariant({ stories, selectedStoryId, onSelectStory }: StudyVariantProps) {
  return (
    <StudySectionFrame
      number="02"
      title="정보 오버레이"
      description="정보 패널을 썸네일 안으로 올린 구성"
      detail="이미지의 몰입감은 유지하되 별도의 하단 카드 몸체를 없앴습니다. 정보는 반투명 패널 하나로 묶어 카드 전체 높이를 절약합니다."
    >
      <StudyRail gap="1rem">
        {stories.map((story) => (
          <MotionStudyCard key={story.id}>
            <CardItem>
              <StudyImage
                story={story}
                sizes="(max-width: 640px) 218px, 252px"
                className="zoom-target"
              />
              <TopScrim aria-hidden="true" />
              <CategoryBadge>
                {story.category}
              </CategoryBadge>
              <OverlayPanel>
                <LocationText>{story.location}</LocationText>
                <TitleHeading>
                  {story.title}
                </TitleHeading>
                <FooterRow>
                  <div style={{ minWidth: 0 }}>
                    <AudioTitle>{story.audioTitle}</AudioTitle>
                    <DurationText>{story.duration}</DurationText>
                  </div>
                  <StudyPlayControl story={story} selectedStoryId={selectedStoryId} onSelectStory={onSelectStory} compact />
                </FooterRow>
              </OverlayPanel>
            </CardItem>
          </MotionStudyCard>
        ))}
      </StudyRail>
    </StudySectionFrame>
  );
}
