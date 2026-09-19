'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play, MapPin, Layers, LayoutGrid } from 'lucide-react';
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

function getStoryTags(story: SorimaruStoryItem, max = 4): string[] {
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

  if (story.tags && story.tags.length > 0) {
    story.tags.forEach(addTag);
  }
  if (story.category) {
    addTag(story.category);
  }
  if (story.locationName) {
    addTag(story.locationName);
  }
  if (story.audioTitle && story.audioTitle !== story.title) {
    addTag(story.audioTitle);
  }
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
  border-radius: 8px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;

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
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            padding: '0.875rem',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <SkeletonBox style={{ height: 68, width: 68, minWidth: 68, flexShrink: 0, borderRadius: '12px' }} />
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <SkeletonBox style={{ height: 16, width: '65%' }} />
              <SkeletonBox style={{ height: 14, width: 38, borderRadius: 4 }} />
            </div>
            <SkeletonBox style={{ height: 12, width: '45%' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <SkeletonBox style={{ height: 10, width: 36 }} />
              <SkeletonBox style={{ height: 10, width: 44 }} />
            </div>
          </div>
        </div>
      ))}
    </SkeletonGrid>
  );
}

/* 🎧 현대적인 개별 스토리 아티클 카드 */
const StoryArticle = styled.article<{ $isCurrent: boolean }>`
  position: relative;
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 0.875rem;
  border-radius: 14px;
  padding: 0.75rem 0.875rem;
  background-color: ${({ $isCurrent }) =>
    $isCurrent ? 'rgba(255, 85, 0, 0.06)' : '#ffffff'};
  border: none;
  box-shadow: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background-color: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(255, 85, 0, 0.1)' : '#f9f9f8'};
    border: none;
    box-shadow: none;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background-color: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(255, 85, 0, 0.14)' : surface.dark.card};
    border: none;
    box-shadow: none;

    &:hover {
      background-color: ${({ $isCurrent }) =>
        $isCurrent ? 'rgba(255, 85, 0, 0.2)' : surface.dark.elevated};
      border: none;
      box-shadow: none;
    }
  }
`;

const ThumbnailSlot = styled.div<{ $isCurrent: boolean }>`
  position: relative;
  width: 4.25rem;
  min-width: 4.25rem;
  height: 4.25rem;
  border-radius: 10px;
  overflow: hidden;
  background-color: #f0f0ee;
  flex-shrink: 0;

  [data-theme='dark'] & {
    background-color: #2d2925;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  article:hover & img {
    transform: scale(1.06);
  }
`;

const PlayOverlay = styled.div<{ $isCurrent: boolean; $isPlaying: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isPlaying }) =>
    $isPlaying ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.22)'};
  opacity: ${({ $isPlaying }) => ($isPlaying ? 1 : 0)};
  transition: opacity 0.2s ease, background-color 0.2s ease;

  article:hover & {
    opacity: 1;
  }
`;

const PlayIconBtn = styled.button`
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  color: #171513;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.1);
    background: #ffffff;
    color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    background: rgba(33, 30, 25, 0.92);
    color: #ffffff;

    &:hover {
      background: #1c1a17;
      color: ${palette.juhong[400]};
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
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

/* 🎯 메인 타이틀: 딥 차콜/화이트로 명확한 가독성 (과도한 주황색 제거) */
const StoryRowTitle = styled.h3<{ $isCurrent: boolean }>`
  font-family: var(--font-hanok);
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${({ $isCurrent }) => ($isCurrent ? palette.juhong[500] : meok[900])};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;

  article:hover & {
    color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    color: ${({ $isCurrent }) => ($isCurrent ? palette.juhong[400] : meok[100])};

    article:hover & {
      color: ${palette.juhong[400]};
    }
  }
`;

const DurationPill = styled.span`
  flex-shrink: 0;
  font-size: 10.5px;
  font-weight: 600;
  color: ${meok[500]};
  background-color: rgba(0, 0, 0, 0.04);
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  white-space: nowrap;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[400]};
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
  gap: 0.2rem 0.45rem;
  font-size: 11px;
  line-height: 1.3;
  margin-top: 0.05rem;
`;

/* 🏷️ 해시태그: 쨍한 주황색 대신 차분한 뉴트럴 쿨그레이로 피로도 대폭 완화 */
const HashtagText = styled.span`
  color: ${meok[500]};
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[400]};
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

  const tags = getStoryTags(story, 4);

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
              <Play size={11} style={{ marginLeft: 1.5 }} fill="currentColor" />
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
            <MapPin size={12} strokeWidth={2} color={palette.juhong[500]} style={{ flexShrink: 0 }} />
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

/* 🏛️ '장소별 묶어 보기' 프리미엄 아일랜드 컨테이너 카드 */
const PlaceGroupContainer = styled.section`
  border-radius: 20px;
  background-color: #f8f8f7;
  padding: 1.125rem;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  box-shadow: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f5f5f4;
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.04);
    border: none;
    box-shadow: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.06);
    }
  }
`;

const PlaceGroupHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.07);
  }
`;

const PlaceHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;

const PlaceGroupTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PlaceCountBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${meok[700]};
  background-color: #ffffff;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  white-space: nowrap;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[300]};
    box-shadow: none;
  }
`;

function PlaceGroupCard({ group, startIndex }: { group: SorimaruPlaceGroup; startIndex: number }) {
  return (
    <PlaceGroupContainer>
      <PlaceGroupHeader>
        <PlaceHeaderLeft>
          <MapPin size={15} strokeWidth={2.2} color={palette.juhong[500]} style={{ flexShrink: 0 }} />
          <PlaceGroupTitle>{group.label}</PlaceGroupTitle>
        </PlaceHeaderLeft>
        <PlaceCountBadge>{group.stories.length}개의 소리</PlaceCountBadge>
      </PlaceGroupHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {group.stories.map((story, index) => (
          <StoryRow key={`${story.stid}-${index}`} story={story} index={startIndex + index} />
        ))}
      </div>
    </PlaceGroupContainer>
  );
}

/* 🧭 아카이브 표시 모드 세그먼티드 컨트롤러 (토스 스타일 캡슐 스위처) */
const ViewSegmentControl = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem;
  border-radius: 9999px;
  background-color: #f0f0ee;
  gap: 0.15rem;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const ViewSegmentBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  color: ${({ $active }) => ($active ? '#171513' : meok[600])};
  background-color: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  border: none;
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none')};
  transition: all 0.18s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#171513' : meok[900])};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
    background-color: ${({ $active }) =>
      $active ? '#2b2824' : 'transparent'};
    box-shadow: ${({ $active }) =>
      $active ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'};

    &:hover {
      color: ${({ $active }) => ($active ? '#ffffff' : meok[200])};
    }
  }
`;

export function SorimaruArchiveBrowse({ stories, isLoading }: SorimaruArchiveBrowseProps) {
  const [view, setView] = useState<ArchiveView>('stories');
  const groups = useMemo(() => groupSorimaruStoriesByPlace(stories), [stories]);

  return (
    <div>
      {/* 보기 방식 세그먼트 스위처 */}
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ViewSegmentControl role="tablist" aria-label="아카이브 표시 방식">
          <ViewSegmentBtn
            type="button"
            role="tab"
            aria-selected={view === 'stories'}
            onClick={() => setView('stories')}
            $active={view === 'stories'}
          >
            <LayoutGrid size={13} />
            이야기별
          </ViewSegmentBtn>
          <ViewSegmentBtn
            type="button"
            role="tab"
            aria-selected={view === 'places'}
            onClick={() => setView('places')}
            $active={view === 'places'}
          >
            <Layers size={13} />
            장소별 묶어 보기
          </ViewSegmentBtn>
        </ViewSegmentControl>

        {view === 'places' && (
          <span style={{ fontSize: fontSize.micro, fontWeight: 500, color: meok[500] }}>
            현재 결과 기준
          </span>
        )}
      </div>

      {isLoading ? (
        <ArchiveSkeleton />
      ) : stories.length === 0 ? (
        <div
          style={{
            padding: '4rem 0',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: meok[600],
          }}
        >
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '1.15rem',
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
