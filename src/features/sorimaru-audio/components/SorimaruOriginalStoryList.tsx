'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Heart, Play, Pause, Music2 } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface Props {
  stories: SorimaruStoryItem[];
  onBookmarkStory?: (story: SorimaruStoryItem) => void;
  bookmarkedIds?: Set<string>;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
];

const imageFor = (story: SorimaruStoryItem, index: number) => {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const categoryFor = (story: SorimaruStoryItem) => {
  const labels: Record<string, string> = { 한옥: '한옥/고택', 시장: '전통시장', 마을: '전통마을', 궁: '궁궐/역사', 길: '자연/둘레길' };
  return labels[story.category] || (story.category !== '오디 이야기' ? story.category : '문화유산');
};

const Container = styled.div`
  width: 100%;
  padding: 0.75rem 0;
`;

const ListWrapper = styled(motion.div)`
  & > * + * {
    border-top: 1px solid rgba(33, 30, 25, 0.05);
  }
`;

const StoryRow = styled(motion.div)<{ isCurrent: boolean }>`
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 0.75rem;
  padding: 0.75rem 0.625rem;
  background-color: ${(props) => (props.isCurrent ? palette.jangmi[50] : 'transparent')};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.isCurrent ? palette.jangmi[50] : '#fff8fa')};
  }
`;

const StoryLeft = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.875rem;
`;

const IndexIndicator = styled.span<{ isCurrent: boolean }>`
  display: flex;
  width: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 10px;
  font-weight: 600;
  color: ${(props) => (props.isCurrent ? palette.jangmi[500] : meok[500])};
`;

const Thumbnail = styled.div`
  position: relative;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: ${meok[200]};

  @media (min-width: 640px) {
    width: 3.25rem;
    height: 3.25rem;
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  ${StoryRow}:hover & img {
    transform: scale(1.05);
  }
`;

const PlayOverlayBadge = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 42, 133, 0.8);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #ffffff;
`;

const StoryMeta = styled.div`
  min-width: 0;
  padding-right: 0.25rem;
`;

const StoryMetaCategory = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
  font-size: 10px;
`;

const CategoryBadge = styled.span`
  flex-shrink: 0;
  font-weight: 700;
  color: ${palette.jangmi[500]};
`;

const LocationText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${meok[500]};
`;

const StoryTitle = styled.h4<{ isCurrent: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${(props) => (props.isCurrent ? palette.jangmi[500] : meok[900])};
  transition: color 0.2s ease;

  @media (min-width: 640px) {
    font-size: ${fontSize.sm};
  }

  ${StoryRow}:hover & {
    color: ${palette.jangmi[500]};
  }
`;

const AudioTitleText = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: ${meok[700]};
`;

const StoryRight = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 640px) {
    gap: 0.75rem;
  }
`;

const BookmarkBtn = styled.button<{ isSaved: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: ${(props) => (props.isSaved ? palette.jangmi[500] : meok[400])};
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover {
    transform: scale(1.1);
    color: ${palette.jangmi[500]};
  }
`;

const DurationText = styled.span`
  display: none;
  font-family: monospace;
  font-size: 10px;
  color: ${meok[500]};

  @media (min-width: 640px) {
    display: inline-block;
  }
`;

const PlayCircleBtn = styled.button<{ isPlaying: boolean }>`
  display: flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid ${(props) => (props.isPlaying ? palette.jangmi[500] : meok[200])};
  background-color: ${(props) => (props.isPlaying ? palette.jangmi[500] : '#ffffff')};
  color: ${(props) => (props.isPlaying ? '#ffffff' : palette.jangmi[500])};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${palette.jangmi[500]};
    border-color: ${palette.jangmi[500]};
    color: #ffffff;
  }
`;

export const SorimaruOriginalStoryList: React.FC<Props> = ({ stories, onBookmarkStory, bookmarkedIds }) => {
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const selectStory = useSorimaruAudioStore((state) => state.selectStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  const play = (story: SorimaruStoryItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <Container>
      <ListWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {stories.map((story, index) => {
          const current = currentStory.stid === story.stid;
          const playing = current && isPlaying;
          const saved = bookmarkedIds?.has(story.stid) ?? false;
          return (
            <StoryRow
              key={story.stid}
              layout
              isCurrent={current}
              onClick={() => selectStory(story)}
            >
              <StoryLeft>
                <IndexIndicator isCurrent={current}>
                  {playing ? <Music2 size={13} strokeWidth={2} style={{ color: palette.jangmi[500] }} /> : String(index + 1).padStart(2, '0')}
                </IndexIndicator>
                <Thumbnail>
                  <img
                    src={imageFor(story, index)}
                    alt={story.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGES[0];
                    }}
                  />
                  {playing && <PlayOverlayBadge>PLAY</PlayOverlayBadge>}
                </Thumbnail>
                <StoryMeta>
                  <StoryMetaCategory>
                    <CategoryBadge>{categoryFor(story)}</CategoryBadge>
                    <LocationText>· {story.locationName || '대한민국 문화유산'}</LocationText>
                  </StoryMetaCategory>
                  <StoryTitle isCurrent={current}>{story.title}</StoryTitle>
                  <AudioTitleText>{story.audioTitle}</AudioTitleText>
                </StoryMeta>
              </StoryLeft>
              <StoryRight>
                {onBookmarkStory && (
                  <BookmarkBtn
                    type="button"
                    isSaved={saved}
                    onClick={(event) => {
                      event.stopPropagation();
                      onBookmarkStory(story);
                    }}
                    aria-label={saved ? '마음에서 삭제' : '마음에 담기'}
                  >
                    {saved ? <Heart size={16} strokeWidth={2} fill="currentColor" /> : <Heart size={16} strokeWidth={2} />}
                  </BookmarkBtn>
                )}
                <DurationText>{story.formattedDuration || '3:00'}</DurationText>
                <PlayCircleBtn
                  type="button"
                  isPlaying={playing}
                  onClick={(event) => play(story, event)}
                  aria-label={playing ? '일시정지' : '재생'}
                >
                  {playing ? <Pause size={13} strokeWidth={2} /> : <Play size={13} fill="currentColor" style={{ marginLeft: 2 }} />}
                </PlayCircleBtn>
              </StoryRight>
            </StoryRow>
          );
        })}
      </ListWrapper>
    </Container>
  );
};
