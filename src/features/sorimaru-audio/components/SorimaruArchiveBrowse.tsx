'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play, MapPin } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import type { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { groupSorimaruStoriesByPlace, type SorimaruPlaceGroup } from '@/features/sorimaru-audio/utils/sorimaruArchiveGrouping';
import { useSorimaruImage } from '@/features/sorimaru-audio/hooks/useSorimaruImage';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface SorimaruArchiveBrowseProps {
  stories: SorimaruStoryItem[];
  isLoading: boolean;
}

type ArchiveView = 'stories' | 'places';

const STOPWORDS = new Set([
  '소리',
  '이야기',
  '소리이야기',
  '오디',
  '오디이야기',
  '대한민국',
  '한국',
  '문화유산',
  '문화재',
  '전체',
  '안내',
  '개요',
  '성인용',
  '어린이용',
  '해설',
  '정보',
  '소리로',
  '만나는',
  '소리들',
  '스토리',
]);

function getStoryTags(story: SorimaruStoryItem, max = 5): string[] {
  const tags: string[] = [];
  const seenRoots = new Set<string>();

  const addTag = (raw?: string) => {
    if (!raw) return;
    const tokens = raw
      .replace(/[#@()\[\]{}<>"'`~:;,._\/\\|!?+*=\-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    for (const token of tokens) {
      const clean = token.trim();
      const lower = clean.toLowerCase();

      if (
        clean.length >= 2 &&
        clean.length <= 14 &&
        !/^\d+$/.test(clean) &&
        !STOPWORDS.has(lower) &&
        !seenRoots.has(lower)
      ) {
        seenRoots.add(lower);
        tags.push(`#${clean}`);
        if (tags.length >= max) break;
      }
    }
  };

  // 1. Explicit tags array
  if (story.tags && story.tags.length > 0) {
    story.tags.forEach(addTag);
  }

  // 2. Category
  if (story.category) {
    addTag(story.category);
  }

  // 3. Location name
  if (story.locationName) {
    addTag(story.locationName);
  }

  // 4. Audio title
  if (story.audioTitle && story.audioTitle !== story.title) {
    addTag(story.audioTitle);
  }

  // 5. Title keywords
  if (tags.length < max && story.title) {
    addTag(story.title);
  }

  return tags.slice(0, max);
}

const shimmerKeyframe = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const eqAnim = keyframes`
  0%, 100% { height: 3px; }
  50% { height: 13px; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e3 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmerKeyframe} 1.6s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

function ArchiveSkeleton() {
  return (
    <SkeletonGrid aria-busy="true" aria-label="이야기를 불러오는 중이에요">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            padding: '0.75rem',
            border: '1px solid #e5e5e3',
          }}
        >
          <SkeletonBox style={{ height: 68, width: 68, minWidth: 68, flexShrink: 0, borderRadius: '6px' }} />
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <SkeletonBox style={{ height: 15, width: '60%' }} />
              <SkeletonBox style={{ height: 14, width: 36, borderRadius: 4 }} />
            </div>
            <SkeletonBox style={{ height: 11, width: '45%' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <SkeletonBox style={{ height: 10, width: 36 }} />
              <SkeletonBox style={{ height: 10, width: 44 }} />
              <SkeletonBox style={{ height: 10, width: 32 }} />
            </div>
          </div>
        </div>
      ))}
    </SkeletonGrid>
  );
}

const StoryArticle = styled.article<{ $isCurrent: boolean }>`
  position: relative;
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 0.75rem;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid ${({ $isCurrent }) => ($isCurrent ? '#d4af37' : '#e5e5e3')};
  box-shadow: ${({ $isCurrent }) => ($isCurrent ? '0 4px 14px rgba(212, 175, 55, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.02)')};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border-color: ${({ $isCurrent }) => ($isCurrent ? '#d4af37' : '#cdcdca')};
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    border: 1px solid ${({ $isCurrent }) => ($isCurrent ? '#d4af37' : 'rgba(255, 255, 255, 0.08)')};
    box-shadow: ${({ $isCurrent }) => ($isCurrent ? '0 4px 14px rgba(0, 0, 0, 0.4)' : 'none')};

    &:hover {
      background-color: ${surface.dark.elevated};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      border-color: ${({ $isCurrent }) => ($isCurrent ? '#d4af37' : 'rgba(255, 255, 255, 0.16)')};
    }
  }
`;

const ThumbnailSlot = styled.div<{ $isCurrent: boolean }>`
  position: relative;
  width: 4.25rem;
  min-width: 4.25rem;
  height: 4.25rem;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f0f0ee;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.04);

  [data-theme='dark'] & {
    background-color: #2d2925;
    border-color: rgba(255, 255, 255, 0.06);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  article:hover & img {
    transform: scale(1.05);
  }
`;

const PlayOverlay = styled.div<{ $isCurrent: boolean; $isPlaying: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isPlaying }) =>
    $isPlaying ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)'};
  opacity: ${({ $isPlaying }) => ($isPlaying ? 1 : 0)};
  transition: opacity 0.2s ease, background-color 0.2s ease;

  article:hover & {
    opacity: 1;
  }
`;

const PlayIconBtn = styled.button`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  color: #211e19;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.1);
    background: #ffffff;
    color: #8B7A49;
  }

  [data-theme='dark'] & {
    background: rgba(33, 30, 25, 0.92);
    color: #ffffff;

    &:hover {
      background: #1c1a17;
      color: #d4af37;
    }
  }
`;

const EqBar = styled.span<{ $delay: string }>`
  width: 2px;
  border-radius: 9999px;
  background-color: currentColor;
  animation: ${eqAnim} 0.8s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay};
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StoryRowTitle = styled.h3<{ $isCurrent: boolean }>`
  font-family: var(--font-hanok);
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.025em;
  color: ${({ $isCurrent }) => ($isCurrent ? '#8B7A49' : meok[900])};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;

  [data-theme='dark'] & {
    color: ${({ $isCurrent }) => ($isCurrent ? '#f3cf7a' : meok[100])};
  }
`;

const DurationPill = styled.span`
  flex-shrink: 0;
  font-size: 10.5px;
  font-weight: 600;
  color: ${meok[600]};
  background-color: rgba(0, 0, 0, 0.04);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[300]};
  }
`;

const LocationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: ${meok[600]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const HashtagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.45rem;
  font-size: 11px;
  line-height: 1.3;
`;

const HashtagText = styled.span`
  color: #8B7A49;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${palette.hwanggeum[200]};
  }
`;

interface StoryRowProps {
  story: SorimaruStoryItem;
  index: number;
}

function StoryRow({ story, index }: StoryRowProps) {
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);
  const isCurrent = currentStory.stid === story.stid;
  const isThisPlaying = isCurrent && isPlaying;
  const imageSrc = useSorimaruImage(story, index);

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isCurrent) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  const playStory = () => {
    if (isCurrent) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  const tags = getStoryTags(story, 5);

  return (
    <StoryArticle onClick={playStory} $isCurrent={isCurrent}>
      <ThumbnailSlot $isCurrent={isCurrent}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={story.title}
          loading="lazy"
        />
        <PlayOverlay $isCurrent={isCurrent} $isPlaying={isThisPlaying}>
          <PlayIconBtn
            type="button"
            onClick={togglePlayback}
            aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
          >
            {isThisPlaying ? (
              <span style={{ display: 'flex', height: 12, alignItems: 'flex-end', gap: 2 }} aria-hidden="true">
                <EqBar $delay="0ms" />
                <EqBar $delay="180ms" />
                <EqBar $delay="90ms" />
              </span>
            ) : (
              <Play size={10} style={{ marginLeft: 1 }} fill="currentColor" />
            )}
          </PlayIconBtn>
        </PlayOverlay>
      </ThumbnailSlot>

      <CardBody>
        <TitleRow>
          <StoryRowTitle $isCurrent={isCurrent}>
            {story.title}
          </StoryRowTitle>
          <DurationPill>
            {story.formattedDuration || '3:00'}
          </DurationPill>
        </TitleRow>

        {story.locationName && (
          <LocationMeta>
            <MapPin size={14} strokeWidth={2} color="#8B7A49" style={{ flexShrink: 0 }} />
            <span>{story.locationName}</span>
          </LocationMeta>
        )}

        {tags.length > 0 && (
          <HashtagsRow>
            {tags.map((tag, i) => (
              <HashtagText key={`${tag}-${i}`}>
                {tag}
              </HashtagText>
            ))}
          </HashtagsRow>
        )}
      </CardBody>
    </StoryArticle>
  );
}

const PlaceGroupSection = styled.section`
  border-radius: 8px;
  background-color: #ffffff;
  padding: 0.75rem;
  border: 1px solid #e5e5e3;

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const PlaceGroupHeader = styled.header`
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.06);
  }
`;

const PlaceGroupTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PlaceGroupCount = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[500]};
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

function PlaceGroupCard({ group, startIndex }: { group: SorimaruPlaceGroup; startIndex: number }) {
  return (
    <PlaceGroupSection>
      <PlaceGroupHeader>
        <PlaceGroupTitle>
          {group.label}
        </PlaceGroupTitle>
        <PlaceGroupCount>
          이야기 {group.stories.length}개
        </PlaceGroupCount>
      </PlaceGroupHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {group.stories.map((story, index) => (
          <StoryRow key={`${story.stid}-${index}`} story={story} index={startIndex + index} />
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
        color: #8B7A49;
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 2px;
          width: calc(100% + 8px);
          background-color: #d4af37;
        }
      `
      : `
        color: ${meok[700]};
        &:hover {
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active &&
      `
        color: ${palette.hwanggeum[200]};
      `}
  }
`;

export function SorimaruArchiveBrowse({ stories, isLoading }: SorimaruArchiveBrowseProps) {
  const [view, setView] = useState<ArchiveView>('stories');
  const groups = useMemo(() => groupSorimaruStoriesByPlace(stories), [stories]);

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 4 }} role="tablist" aria-label="아카이브 표시 방식">
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
        <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.75rem', color: meok[700] }}>
          조건에 맞는 이야기가 아직 없어요.
        </div>
      ) : view === 'stories' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {stories.map((story, index) => (
            <StoryRow key={`${story.stid}-${index}`} story={story} index={index} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
