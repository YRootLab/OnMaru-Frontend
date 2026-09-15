'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { Heart, Play, Pause } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface SorimaruStoryCardGridProps {
  stories: SorimaruStoryItem[];
  isLoading?: boolean;
  onBookmarkStory?: (story: SorimaruStoryItem) => void;
  bookmarkedIds?: Set<string>;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

const fallbackImageFor = (story: SorimaruStoryItem, index: number) => {
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const categoryLabelFor = (story: SorimaruStoryItem) => {
  const labels: Record<string, string> = {
    한옥: '한옥과 고택', 시장: '전통 시장', 마을: '마을과 골목', 궁: '궁궐과 역사', 길: '자연과 숲길',
  };
  return labels[story.category] || (story.category !== '오디 이야기' && story.category !== '소리 이야기' ? story.category : '문화유산');
};

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #eee8df 25%, #f5f0e8 50%, #eee8df 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const SkeletonCard = styled.div`
  overflow: hidden;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StoryCard = styled(motion.article)<{ isCurrent: boolean }>`
  position: relative;
  display: flex;
  min-height: 124px;
  align-items: center;
  gap: 0.875rem;
  border-radius: 1rem;
  padding: 0.75rem;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border: 1px solid ${(props) => (props.isCurrent ? 'rgba(255, 42, 133, 0.4)' : 'rgba(255, 255, 255, 0.7)')};
  background: ${(props) =>
    props.isCurrent
      ? `linear-gradient(to right, ${palette.jangmi[50]}, #ffffff, #ffffff)`
      : 'rgba(255, 255, 255, 0.8)'};
  box-shadow: ${(props) =>
    props.isCurrent
      ? '0 10px 15px -3px rgba(255, 42, 133, 0.1), 0 0 0 1px rgba(255, 42, 133, 0.2)'
      : 'none'};

  &:hover {
    border-color: rgba(255, 42, 133, 0.3);
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 25px -5px rgba(110, 0, 48, 0.05);
  }
`;

const Thumbnail = styled.div`
  position: relative;
  height: 96px;
  width: 104px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  background-color: #f3eee8;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);

  @media (min-width: 640px) {
    height: 108px;
    width: 118px;
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  ${StoryCard}:hover & img {
    transform: scale(1.15);
  }
`;

const ThumbnailGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05));
  transition: opacity 0.3s ease;

  ${StoryCard}:hover & {
    opacity: 0.9;
  }
`;

const IndexPill = styled.span`
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  border-radius: 0.375rem;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 0.125rem 0.5rem;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  backdrop-filter: blur(4px);
`;

const PlayButton = styled.button<{ isCurrent: boolean }>`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background-color: ${(props) => (props.isCurrent ? palette.jangmi[500] : 'rgba(255, 255, 255, 0.95)')};
  color: ${(props) => (props.isCurrent ? '#ffffff' : palette.jangmi[500])};

  &:hover {
    background-color: ${palette.jangmi[500]};
    color: #ffffff;
    transform: scale(1.1);
  }
`;

const InfoCol = styled.div`
  min-width: 0;
  flex: 1;
  padding: 0.25rem 0.25rem 0.25rem 0;
`;

const TopMetaRow = styled.div`
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const CategoryTag = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 0.375rem;
  background-color: rgba(255, 42, 133, 0.1);
  padding: 0.125rem 0.5rem;
  font-size: 10px;
  font-weight: 700;
  color: ${palette.jangmi[500]};
`;

const BookmarkButton = styled.button<{ isBookmarked: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: ${(props) => (props.isBookmarked ? palette.jangmi[500] : meok[400])};
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover {
    transform: scale(1.25);
    color: ${palette.jangmi[500]};
  }
`;

const CardTitle = styled.h4`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
  font-size: ${fontSize.sm};
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.03em;
  color: ${meok[900]};
  transition: color 0.2s ease;

  ${StoryCard}:hover & {
    color: ${palette.jangmi[500]};
  }
`;

const BottomMetaRow = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 10px;
  color: ${meok[500]};
`;

const CardSkeleton = () => (
  <SkeletonCard>
    <SkeletonBox style={{ height: 176, borderRadius: 16 }} />
    <div style={{ padding: '1rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <SkeletonBox style={{ height: 10, width: 80, borderRadius: 4 }} />
      <SkeletonBox style={{ height: 16, width: '80%', borderRadius: 4 }} />
      <SkeletonBox style={{ height: 10, width: '40%', borderRadius: 4 }} />
    </div>
  </SkeletonCard>
);

export const SorimaruStoryCardGrid: React.FC<SorimaruStoryCardGridProps> = ({
  stories,
  isLoading = false,
  onBookmarkStory,
  bookmarkedIds,
}) => {
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  const handlePlay = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
      return;
    }
    setCurrentStory(story);
  };

  return (
    <div aria-busy={isLoading} style={{ width: '100%' }}>
      <GridContainer>
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} />)
          : stories.slice(0, 6).map((story, index) => {
            const isCurrent = currentStory.stid === story.stid;
            const isBookmarked = bookmarkedIds?.has(story.stid) ?? false;
            const imageUrl = story.imageUrl || fallbackImageFor(story, index);

            return (
              <StoryCard
                key={`${story.stid}-${index}`}
                layout
                isCurrent={isCurrent}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <Thumbnail>
                  <img
                    src={imageUrl}
                    alt={story.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGES[0];
                    }}
                  />
                  <ThumbnailGradient />
                  <IndexPill>
                    {String(index + 1).padStart(2, '0')}
                  </IndexPill>
                  <PlayButton
                    type="button"
                    isCurrent={isCurrent}
                    onClick={() => handlePlay(story)}
                    aria-label={`${story.title} ${isCurrent && isPlaying ? '일시정지' : '재생'}`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={15} strokeWidth={2} />
                    ) : (
                      <Play size={15} fill="currentColor" style={{ marginLeft: 2 }} />
                    )}
                  </PlayButton>
                </Thumbnail>

                <InfoCol>
                  <TopMetaRow>
                    <CategoryTag>{categoryLabelFor(story)}</CategoryTag>
                    {onBookmarkStory && (
                      <BookmarkButton
                        type="button"
                        isBookmarked={isBookmarked}
                        onClick={() => onBookmarkStory(story)}
                        aria-label={isBookmarked ? '마음에서 삭제' : '마음에 담기'}
                      >
                        {isBookmarked ? <Heart size={16} strokeWidth={2} fill="currentColor" /> : <Heart size={16} strokeWidth={2} />}
                      </BookmarkButton>
                    )}
                  </TopMetaRow>
                  <CardTitle>{story.title}</CardTitle>
                  <BottomMetaRow>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {story.locationName || '대한민국 문화유산'}
                    </span>
                    <span style={{ flexShrink: 0, fontFamily: 'monospace', fontWeight: 600 }}>
                      {story.formattedDuration || '3:00'}
                    </span>
                  </BottomMetaRow>
                </InfoCol>
              </StoryCard>
            );
          })}
      </GridContainer>
    </div>
  );
};
