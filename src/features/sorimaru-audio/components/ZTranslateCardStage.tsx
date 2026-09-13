'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play, Pause, Clock } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface ZTranslateCardStageProps {
  featuredStories: SorimaruStoryItem[];
}

const float3d = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(4deg); }
  50% { transform: translateY(-8px) rotateX(1deg); }
`;

const SectionContainer = styled.section`
  position: relative;
  width: 100%;
  padding: 4rem 0;
  overflow: hidden;
  background: linear-gradient(to bottom, #141210, #1A1815, #141210);
  color: #ffffff;
  border-radius: 1.5rem;
  margin: 2rem 0;
`;

const GlowOrb = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(212, 32, 88, 0.15) 0%, rgba(245, 166, 35, 0.1) 50%, transparent 70%);
  border-radius: 9999px;
  filter: blur(48px);
  pointer-events: none;
`;

const HeaderBox = styled.div`
  text-align: center;
  position: relative;
  z-index: 20;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

const BadgePill = styled.span`
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: ${palette.jangmi[200]};
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-block;
  margin-bottom: 0.75rem;
`;

const StageHeading = styled.h2`
  font-family: inherit;
  font-size: ${fontSize['2xl']};
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #ffffff;

  @media (min-width: 640px) {
    font-size: ${fontSize['4xl']};
  }
`;

const StageDesc = styled.p`
  margin-top: 0.5rem;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
  font-size: ${fontSize.xs};
  color: #A09588;

  @media (min-width: 640px) {
    font-size: ${fontSize.sm};
  }
`;

const PerspectiveScene = styled.div`
  position: relative;
  z-index: 20;
  width: 100%;
  min-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
`;

const FloatingStack = styled.div`
  position: relative;
  width: 300px;
  height: 380px;
  transform-style: preserve-3d;
  animation: ${float3d} 6s ease-in-out infinite;

  @media (min-width: 640px) {
    width: 360px;
    height: 420px;
  }
`;

const StageCard = styled.div<{
  isActive: boolean;
  zTrans: number;
  rotY: number;
  transX: number;
  zIndex: number;
}>`
  position: absolute;
  inset: 0;
  border-radius: 1.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  backdrop-filter: blur(24px);
  transform: translateZ(${(props) => props.zTrans}px) rotateY(${(props) => props.rotY}deg) translateX(${(props) => props.transX}px);
  z-index: ${(props) => props.zIndex};

  border: 1px solid ${(props) => (props.isActive ? 'rgba(212, 32, 88, 0.8)' : 'rgba(255, 255, 255, 0.1)')};
  background: ${(props) =>
    props.isActive
      ? 'linear-gradient(to bottom, rgba(42, 35, 29, 0.95), rgba(26, 21, 18, 0.95))'
      : 'rgba(28, 24, 20, 0.85)'};
  opacity: ${(props) => (props.isActive ? 1 : 0.8)};
  box-shadow: ${(props) => (props.isActive ? '0 20px 40px -15px rgba(212, 32, 88, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)')};

  &:hover {
    opacity: 1;
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CategoryBadge = styled.span`
  padding: 0.25rem 0.625rem;
  font-size: 10px;
  font-weight: 700;
  border-radius: 0.375rem;
  background-color: ${palette.jangmi[700]};
  color: #ffffff;
`;

const DistanceLabel = styled.span`
  font-size: ${fontSize.xs};
  color: rgba(255, 255, 255, 0.6);
  font-family: monospace;
`;

const ThumbBox = styled.div`
  position: relative;
  width: 100%;
  height: 11rem;
  border-radius: 1rem;
  overflow: hidden;
  margin: 0.75rem 0;
  transition: transform 0.5s ease;

  ${StageCard}:hover & {
    transform: scale(1.05);
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ThumbOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent, transparent);
  display: flex;
  align-items: flex-end;
  padding: 0.75rem;
  justify-content: space-between;
`;

const PlayRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlayCircle = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: ${palette.jangmi[700]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const PlayStatusText = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: #ffffff;
`;

const CardBottom = styled.div``;

const CardTitle = styled.h3`
  font-family: inherit;
  font-size: ${fontSize.base};
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;

  @media (min-width: 640px) {
    font-size: ${fontSize.lg};
  }

  ${StageCard}:hover & {
    color: ${palette.jangmi[200]};
  }
`;

const MetaLine = styled.p`
  margin-top: 0.25rem;
  font-size: ${fontSize.xs};
  color: #A09588;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const ZTranslateCardStage: React.FC<ZTranslateCardStageProps> = ({ featuredStories }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);

  const displayStories = featuredStories.slice(0, 3);

  const handleCardClick = (story: SorimaruStoryItem, idx: number) => {
    setActiveIdx(idx);
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <SectionContainer>
      {/* 배경 3D 빛/입자 그라데이션 */}
      <GlowOrb />

      {/* 헤더 */}
      <HeaderBox>
        <BadgePill>
          SHOPIFY EDITIONS INSPIRED • 3D STAGE
        </BadgePill>
        <StageHeading>
          3차원 Z-축 공간으로 만나는 오디 큐레이션
        </StageHeading>
        <StageDesc>
          카드를 터치하면 오디오가 재생되며, 이미 재생 중인 카드를 다시 터치하면 일시정지됩니다.
        </StageDesc>
      </HeaderBox>

      {/* 3D Scene Wrapper */}
      <PerspectiveScene>
        <FloatingStack>
          {displayStories.map((story, idx) => {
            const isActive = activeIdx === idx;
            const isThisPlaying = currentStory.stid === story.stid && isPlaying;

            let zTrans = -300 + idx * 120;
            let rotY = idx === 0 ? -12 : idx === 2 ? 12 : 0;
            let transX = idx === 0 ? -50 : idx === 2 ? 50 : 0;

            if (isActive) {
              zTrans = 80;
              rotY = 0;
              transX = 0;
            }

            return (
              <StageCard
                key={story.stid}
                isActive={isActive}
                zTrans={zTrans}
                rotY={rotY}
                transX={transX}
                zIndex={isActive ? 40 : 10 + idx}
                onClick={() => handleCardClick(story, idx)}
              >
                {/* 카드 상단 헤더 */}
                <CardTop>
                  <CategoryBadge>
                    {story.category}
                  </CategoryBadge>
                  <DistanceLabel>
                    {story.distance || '300m'}
                  </DistanceLabel>
                </CardTop>

                {/* 중앙 썸네일 */}
                <ThumbBox>
                  <img
                    src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                    alt={story.title}
                  />
                  <ThumbOverlay>
                    <PlayRow>
                      <PlayCircle>
                        {isThisPlaying ? (
                          <Pause size={16} strokeWidth={2} />
                        ) : (
                          <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
                        )}
                      </PlayCircle>
                      <PlayStatusText>
                        {isThisPlaying ? '일시정지' : '오디오 재생'}
                      </PlayStatusText>
                    </PlayRow>
                  </ThumbOverlay>
                </ThumbBox>

                {/* 하단 텍스트 정보 */}
                <CardBottom>
                  <CardTitle>
                    {story.title}
                  </CardTitle>
                  <MetaLine>
                    <span>{story.audioTitle}</span>
                    <span>•</span>
                    <Clock size={12} strokeWidth={2} />
                    <span>{story.formattedDuration}</span>
                  </MetaLine>
                </CardBottom>
              </StageCard>
            );
          })}
        </FloatingStack>
      </PerspectiveScene>
    </SectionContainer>
  );
};
