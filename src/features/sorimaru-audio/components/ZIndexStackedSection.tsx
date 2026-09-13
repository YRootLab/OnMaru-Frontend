'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Play, Pause } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruChapterPresentation } from '@/features/sorimaru-audio/types/sorimaruChapter.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface ZIndexStackedSectionProps {
  chapters: SorimaruChapterPresentation[];
}

const SectionContainer = styled.section`
  position: relative;
  width: 100%;
  padding: 2rem 0;

  @media (min-width: 640px) {
    padding: 3rem 0;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1.25rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

const SectionTitle = styled.h2`
  display: inline-block;
  background: linear-gradient(to right, #211e19, #403b35, #6a6158);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: inherit;
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.04em;
`;

const SectionDesc = styled.p`
  font-size: ${fontSize.xs};
  color: ${meok[700]};
`;

const ChipsRail = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChipButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  font-size: ${fontSize.xs};
  font-weight: ${(props) => (props.isActive ? '700' : '600')};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${(props) => (props.isActive ? meok[900] : '#f7f4ee')};
  color: ${(props) => (props.isActive ? '#ffffff' : meok[700])};

  &:hover {
    background-color: ${(props) => (props.isActive ? meok[900] : '#ede5d8')};
    color: ${(props) => (props.isActive ? '#ffffff' : meok[900])};
  }
`;

const EditorialCardBox = styled.div`
  position: relative;
  min-height: 360px;
  width: 100%;
  overflow: hidden;
  border-radius: 1.5rem;
  background-color: #fbf8f2;
`;

const MotionGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 320px;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 360px;
  }
`;

const LeftContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const ChapterHeading = styled.h3`
  font-family: inherit;
  font-size: ${fontSize['2xl']};
  font-weight: 700;
  letter-spacing: -0.025em;
  color: ${meok[900]};

  @media (min-width: 640px) {
    font-size: ${fontSize['3xl']};
  }
`;

const ChapterSubtitle = styled.p`
  margin-top: 0.375rem;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${palette.danpung[700]};
`;

const NarrativeQuote = styled.p`
  margin-top: 0.75rem;
  font-size: ${fontSize.xs};
  line-height: 1.625;
  color: ${meok[700]};

  @media (min-width: 640px) {
    font-size: ${fontSize.sm};
  }
`;

const BottomTracksArea = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
`;

const TracksGrid = styled.div`
  display: grid;
  gap: 0.625rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TrackCard = styled.div<{ isCurrent: boolean }>`
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background-color: ${(props) => (props.isCurrent ? '#f4ebe1' : '#ffffff')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.isCurrent ? '#f4ebe1' : '#fafafa')};
  }
`;

const TrackInfo = styled.div`
  min-width: 0;
  padding-right: 0.5rem;
`;

const TrackLocation = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${palette.danpung[700]};
`;

const TrackTitle = styled.h4`
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${meok[900]};
`;

const PlayTrackBtn = styled.button<{ isPlaying: boolean }>`
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  background-color: ${(props) => (props.isPlaying ? palette.danpung[700] : meok[900])};
  color: #ffffff;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${palette.danpung[700]};
  }
`;

const RightFrame = styled.div`
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border-bottom-left-radius: 1.5rem;
  border-bottom-right-radius: 1.5rem;

  @media (min-width: 768px) {
    border-bottom-left-radius: 0;
    border-top-right-radius: 1.5rem;
    border-bottom-right-radius: 1.5rem;
  }

  & img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

const FrameVignette = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent, transparent);
`;

export const ZIndexStackedSection: React.FC<ZIndexStackedSectionProps> = ({ chapters }) => {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || 'hanok');
  const shouldReduceMotion = useReducedMotion();

  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  const activeChapter = chapters.find((chap) => chap.id === activeChapterId) || chapters[0];

  if (!activeChapter) return null;

  const handlePlayStory = (story: any) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const heroImage = activeChapter.heroImageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1600&q=85';

  return (
    <SectionContainer aria-label="장면별 이야길 깊이 들여다보기">
      <div style={{ width: '100%' }}>
        <HeaderRow>
          <div>
            <SectionTitle>
              소리와 장면으로 만나는 한국의 온기
            </SectionTitle>
          </div>
          <SectionDesc>
            각 챕터를 선택해 깊은 이야기 속으로 들어가보세요.
          </SectionDesc>
        </HeaderRow>

        {/* 챕터 가로 칩 */}
        <ChipsRail>
          {chapters.map((chap) => {
            const isActive = chap.id === activeChapter.id;
            return (
              <ChipButton
                key={chap.id}
                type="button"
                isActive={isActive}
                onClick={() => setActiveChapterId(chap.id)}
              >
                <span>{chap.title}</span>
              </ChipButton>
            );
          })}
        </ChipsRail>

        {/* 에디토리얼 카드 */}
        <EditorialCardBox>
          <AnimatePresence mode="wait">
            <MotionGrid
              key={activeChapter.id}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* 좌측 텍스트 내러티브 & 트랙 */}
              <LeftContent>
                <div>
                  <ChapterHeading>
                    {activeChapter.title}
                  </ChapterHeading>
                  <ChapterSubtitle>
                    {activeChapter.subTitle}
                  </ChapterSubtitle>
                  <NarrativeQuote>
                    “{activeChapter.narrative}”
                  </NarrativeQuote>
                </div>

                {/* 하단 대표 트랙 2개 */}
                <BottomTracksArea>
                  <TracksGrid>
                    {activeChapter.stories.slice(0, 2).map((story) => {
                      const isCurrent = currentStory.stid === story.stid;
                      const isThisPlaying = isCurrent && isPlaying;
                      return (
                        <TrackCard
                          key={story.stid}
                          isCurrent={isCurrent}
                          onClick={() => handlePlayStory(story)}
                        >
                          <TrackInfo>
                            <TrackLocation>
                              {story.locationName || '소리 공간'}
                            </TrackLocation>
                            <TrackTitle>
                              {story.title}
                            </TrackTitle>
                          </TrackInfo>

                          <PlayTrackBtn
                            type="button"
                            isPlaying={isThisPlaying}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayStory(story);
                            }}
                            aria-label={isThisPlaying ? '일시정지' : '재생'}
                          >
                            {isThisPlaying ? (
                              <Pause size={14} strokeWidth={2} />
                            ) : (
                              <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />
                            )}
                          </PlayTrackBtn>
                        </TrackCard>
                      );
                    })}
                  </TracksGrid>
                </BottomTracksArea>
              </LeftContent>

              {/* 우측 단일 액자 비주얼 */}
              <RightFrame>
                <img
                  src={heroImage}
                  alt={activeChapter.title}
                />
                <FrameVignette />
              </RightFrame>
            </MotionGrid>
          </AnimatePresence>
        </EditorialCardBox>
      </div>
    </SectionContainer>
  );
};
