'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { CompactPosterVariant } from './CompactPosterVariant';
import { EditorialCaptionVariant } from './EditorialCaptionVariant';
import { LandscapeCardVariant } from './LandscapeCardVariant';
import { OverlayInfoVariant } from './OverlayInfoVariant';
import { SECTION2_STUDY_STORIES } from './studyData';
import { palette, meok, surface } from '@/design-system/tokens';

const MainContainer = styled.main`
  position: relative;
  isolation: isolate;
  overflow-x: clip;
  padding-bottom: 6rem;
  color: #211e19;
  font-family: var(--font-hanok);

  [data-theme='dark'] & {
    color: ${meok[100]};
    background-color: ${surface.dark.app};
  }
`;

const BackgroundGlow = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: -10;
  height: 620px;
  background:
    radial-gradient(circle at 12% 12%, rgba(248, 78, 118, 0.12), transparent 32%),
    radial-gradient(circle at 82% 4%, rgba(206, 178, 136, 0.22), transparent 31%),
    linear-gradient(180deg, #fffaf5 0%, rgba(255, 250, 245, 0) 100%);

  [data-theme='dark'] & {
    background:
      radial-gradient(circle at 12% 12%, rgba(248, 78, 118, 0.05), transparent 32%),
      radial-gradient(circle at 82% 4%, rgba(206, 178, 136, 0.08), transparent 31%),
      linear-gradient(180deg, #121110 0%, rgba(18, 17, 16, 0) 100%);
  }
`;

const HeaderContainer = styled.header`
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 72rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 3rem;
  padding-top: 3rem;
  @media (min-width: 640px) {
    padding-bottom: 4rem;
    padding-top: 5rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

const HeaderInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2.5rem;
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 3rem;
  }
`;

const TitleColumn = styled.div`
  max-width: 48rem;
`;

const CategoryTag = styled.p`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: ${palette.jangmi[500]};
`;

const MainTitle = styled.h1`
  margin-top: 1rem;
  font-family: var(--font-hanok);
  font-size: clamp(34px, 5.5vw, 64px);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.065em;
  color: #211e19;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const MainDesc = styled.p`
  margin-top: 1.25rem;
  max-width: 42rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  color: #655b4d;
  @media (min-width: 640px) {
    font-size: 1rem;
    line-height: 1.75rem;
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const MetaGrid = styled.div`
  display: grid;
  width: 100%;
  max-width: 20rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border-radius: 18px;
  background-color: rgba(33, 30, 25, 0.1);
  font-size: 10px;
  @media (min-width: 640px) {
    width: 270px;
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MetaCell = styled.div`
  background-color: rgba(255, 253, 249, 0.9);
  padding: 0.75rem;

  span {
    display: block;
    color: #8c7e6c;
  }
  strong {
    display: block;
    margin-top: 0.25rem;
    color: #403930;
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};

    span {
      color: ${meok[400]};
    }
    strong {
      color: ${meok[100]};
    }
  }
`;

const ContentContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 72rem;
  padding-left: 1rem;
  padding-right: 1rem;
  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

export function Section2UiImprovements() {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const sharedProps = {
    stories: SECTION2_STUDY_STORIES,
    selectedStoryId,
    onSelectStory: setSelectedStoryId,
  };

  return (
    <MainContainer>
      <BackgroundGlow aria-hidden="true" />
      <HeaderContainer>
        <HeaderInner>
          <TitleColumn>
            <CategoryTag>SORIMARU · SECTION 2 UI IMPROVEMENTS</CategoryTag>
            <MainTitle>
              같은 이야기를,
              <br />
              네 가지 호흡으로.
            </MainTitle>
            <MainDesc>
              기존 “장면을 골라 듣다”를 그대로 둔 채, 카드 높이와 정보 위치, 여백과 모서리만 달리해 비교하는 독립 시안 페이지입니다.
            </MainDesc>
          </TitleColumn>
          <MetaGrid>
            <MetaCell>
              <span>데이터</span>
              <strong>목 스토리 5개</strong>
            </MetaCell>
            <MetaCell>
              <span>범위</span>
              <strong>카드 UI 4안</strong>
            </MetaCell>
          </MetaGrid>
        </HeaderInner>
      </HeaderContainer>

      <ContentContainer>
        <CompactPosterVariant {...sharedProps} />
        <OverlayInfoVariant {...sharedProps} />
        <EditorialCaptionVariant {...sharedProps} />
        <LandscapeCardVariant {...sharedProps} />
      </ContentContainer>
    </MainContainer>
  );
}
