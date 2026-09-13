'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play, Pause } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import type { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { groupSorimaruStoriesByPlace, type SorimaruPlaceGroup } from '@/features/sorimaru-audio/utils/sorimaruArchiveGrouping';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface SorimaruArchiveBrowseProps {
  stories: SorimaruStoryItem[];
  isLoading: boolean;
}

type ArchiveView = 'stories' | 'places';

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

function imageFor(story: SorimaruStoryItem, index: number) {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

function storyContext(story: SorimaruStoryItem) {
  const location = story.locationName || '대한민국 문화유산';
  const category = story.category && story.category !== '오디 이야기' ? story.category : '';
  return category ? `${category} · ${location}` : location;
}

const shimmerAnim = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e3 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

function ArchiveSkeleton() {
  return (
    <SkeletonGrid aria-busy="true" aria-label="이야기 목록 로딩 중">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '1rem', backgroundColor: '#f8f8f7', padding: '0.75rem' }}>
          <SkeletonBox style={{ height: 80, width: 80, flexShrink: 0, borderRadius: 12 }} />
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonBox style={{ height: 10, width: 96 }} />
            <SkeletonBox style={{ height: 16, width: '80%' }} />
            <SkeletonBox style={{ height: 10, width: '40%' }} />
          </div>
        </div>
      ))}
    </SkeletonGrid>
  );
}

const eqAnim = keyframes`
  0%, 100% { height: 3px; }
  50% { height: 12px; }
`;

const StoryArticle = styled.article<{ $isCurrent: boolean }>`
  position: relative;
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 1rem;
  border-radius: 1rem;
  padding: 0.75rem;
  transition: all 0.3s ease;

  background-color: ${({ $isCurrent }) => ($isCurrent ? '#FFF0F6' : '#f8f8f7')};

  &:hover {
    background-color: ${({ $isCurrent }) => ($isCurrent ? '#FFF0F6' : '#f0f0f0')};
  }

  &:hover img {
    transform: scale(1.28);
  }
`;

const ThumbSlot = styled.div`
  position: relative;
  height: 5rem;
  width: 5rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  background-color: #e5e5e3;

  @media (min-width: 640px) {
    height: 86px;
    width: 86px;
  }
`;

const StoryThumbImg = styled.img`
  height: 100%;
  width: 100%;
  transform: scale(1.18);
  object-fit: cover;
  transition: transform 0.5s ease;
`;

const IndexBadge = styled.span`
  position: absolute;
  left: 0.375rem;
  top: 0.375rem;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.45);
  padding: 2px 4px;
  font-family: monospace;
  font-size: ${fontSize.micro};
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  backdrop-filter: blur(4px);
`;

const PlayHoverOverlay = styled.div<{ $show: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.35);
  transition: opacity 0.2s ease;
  opacity: ${({ $show }) => ($show ? 1 : 0)};

  article:hover & {
    opacity: 1;
  }
`;

const PlayCircle = styled.button`
  display: grid;
  height: 2.25rem;
  width: 2.25rem;
  place-items: center;
  border-radius: 9999px;
  background-color: #ffffff;
  color: ${palette.jangmi[500]};
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:active {
    transform: scale(0.9);
  }
`;

const EqBar = styled.span<{ $delay: string }>`
  width: 2.5px;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  animation: ${eqAnim} 0.8s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay};
`;

const DurationPill = styled.span`
  flex-shrink: 0;
  align-self: flex-start;
  white-space: nowrap;
  border-radius: 9999px;
  background-color: rgba(33, 30, 25, 0.05);
  padding: 0.25rem 0.5rem;
  font-size: ${fontSize.micro};
  font-weight: 600;
  color: ${meok[700]};
`;

interface StoryRowProps {
  story: SorimaruStoryItem;
  index: number;
}

function StoryRow({ story, index }: StoryRowProps) {
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const selectStory = useSorimaruAudioStore((state) => state.selectStory);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);
  const isCurrent = currentStory.stid === story.stid;
  const isThisPlaying = isCurrent && isPlaying;

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isCurrent) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <StoryArticle onClick={() => selectStory(story)} $isCurrent={isCurrent}>
      <ThumbSlot>
        <StoryThumbImg
          src={imageFor(story, index)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGES[0];
          }}
        />

        <IndexBadge>{String(index + 1).padStart(2, '0')}</IndexBadge>

        <PlayHoverOverlay $show={isThisPlaying}>
          <PlayCircle
            type="button"
            onClick={togglePlayback}
            aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
          >
            {isThisPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
          </PlayCircle>
        </PlayHoverOverlay>

        {isThisPlaying && (
          <span
            style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', height: 12, alignItems: 'flex-end', gap: 2 }}
            aria-hidden="true"
          >
            <EqBar $delay="0ms" />
            <EqBar $delay="180ms" />
            <EqBar $delay="90ms" />
          </span>
        )}
      </ThumbSlot>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.micro, lineHeight: '1rem', color: meok[700] }}>
          {storyContext(story)}
        </p>
        <h3
          style={{
            marginTop: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'var(--font-hanok)',
            fontSize: '0.875rem',
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacing: '-0.028em',
            color: isCurrent ? palette.jangmi[500] : meok[900],
          }}
        >
          {story.title}
        </h3>
        <p style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.micro, color: meok[700] }}>
          {story.audioTitle || story.locationName || '오디오 가이드'}
        </p>
      </div>

      <DurationPill>{story.formattedDuration || '3:00'}</DurationPill>
    </StoryArticle>
  );
}

const PlaceGroupSection = styled.section`
  border-radius: 1rem;
  background-color: #f5f5f4;
  padding: 1rem;
`;

const PlaceGroupHeader = styled.header`
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  img {
    height: 3.5rem;
    width: 3.5rem;
    border-radius: 10px;
    object-fit: cover;
  }
`;

function PlaceGroupCard({ group, startIndex }: { group: SorimaruPlaceGroup; startIndex: number }) {
  return (
    <PlaceGroupSection>
      <PlaceGroupHeader>
        <img src={imageFor(group.representative, startIndex)} alt="" loading="lazy" decoding="async" />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-hanok)', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.03em', color: meok[900] }}>
            {group.label}
          </h3>
          <p style={{ marginTop: 2, fontSize: fontSize.micro, color: meok[700] }}>
            현재 결과의 이야기 {group.stories.length}개
          </p>
        </div>
      </PlaceGroupHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {group.stories.map((story, index) => (
          <StoryRow key={story.stid} story={story} index={startIndex + index} />
        ))}
      </div>
    </PlaceGroupSection>
  );
}

const ViewTabBtn = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 0.25rem 0.25rem 0.5rem;
  font-size: 0.75rem;
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;

  ${({ $active }) =>
    $active
      ? `
        font-weight: 600;
        color: ${palette.jangmi[500]};
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 2px;
          width: calc(100% + 8px);
          background-color: ${palette.jangmi[500]};
        }
      `
      : `
        color: ${meok[700]};
        &:hover {
          color: ${meok[900]};
        }
      `}
`;

export function SorimaruArchiveBrowse({ stories, isLoading }: SorimaruArchiveBrowseProps) {
  const [view, setView] = useState<ArchiveView>('stories');
  const groups = useMemo(() => groupSorimaruStoriesByPlace(stories), [stories]);

  return (
    <div>
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 4 }} role="tablist" aria-label="아카이브 표시 방식">
        <ViewTabBtn
          type="button"
          role="tab"
          aria-selected={view === 'stories'}
          onClick={() => setView('stories')}
          $active={view === 'stories'}
        >
          이야기
        </ViewTabBtn>
        <ViewTabBtn
          type="button"
          role="tab"
          aria-selected={view === 'places'}
          onClick={() => setView('places')}
          $active={view === 'places'}
          style={{ marginLeft: '1rem' }}
        >
          장소별 묶어 보기
        </ViewTabBtn>
        {view === 'places' && (
          <span style={{ marginLeft: 'auto', paddingBottom: 8, fontSize: fontSize.micro, color: meok[500] }}>
            현재 결과 기준
          </span>
        )}
      </div>

      {isLoading ? (
        <ArchiveSkeleton />
      ) : stories.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', fontSize: '0.75rem', color: meok[700] }}>
          선택한 조건에 해당하는 오디오 가이드가 없습니다.
        </div>
      ) : view === 'stories' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {stories.map((story, index) => (
            <StoryRow key={story.stid} story={story} index={index} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {groups.map((group, index) => (
            <PlaceGroupCard key={group.key} group={group} startIndex={index * 10} />
          ))}
        </div>
      )}
    </div>
  );
}
