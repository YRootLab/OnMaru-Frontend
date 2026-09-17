'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useSorimaruImage, getSorimaruFallbackImage } from '@/features/sorimaru-audio/hooks/useSorimaruImage';
import { motion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS, KoreaRegionPath } from '@/features/sorimaru-audio/data/koreaMapPaths';
import { useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { getVirtualRange, VIRTUAL_ITEM_HEIGHT } from './soundConstellationScroll';
import { useViewportActivation } from '@/shared/hooks/useViewportActivation';
import {
  SOUND_CONSTELLATION_API_ROOT_MARGIN,
  getRegionPathMotion,
} from './soundConstellationMotion';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface SoundConstellationSectionProps {
  stories: SorimaruStoryItem[];
}

const [VB_WIDTH, VB_HEIGHT] = KOREA_MAP_VIEWBOX.split(' ').slice(2).map(Number);
const LIST_EDGE_INSET = 23;

const normalizeText = (story: SorimaruStoryItem) => `${story.locationName || ''} ${story.title} ${story.audioTitle || ''} ${story.category || ''}`;
const getRegionStories = (stories: SorimaruStoryItem[], region: KoreaRegionPath) => {
  const matched = stories.filter((story) => region.keywords.some((keyword) => normalizeText(story).includes(keyword)));
  return matched.length ? matched : stories.slice(0, 4);
};

// ==========================================
// Styled Components
// ==========================================
const pulseKeyframe = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.15); }
`;

const spinKeyframe = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const shimmerKeyframe = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SectionWrapper = styled.section`
  width: 100%;
  padding: 2.5rem 0;

  @media (min-width: 640px) {
    padding: 3.5rem 0;
  }
`;

const InnerContainer = styled.div`
  margin: 0 auto;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  padding: 0;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const SectionHeader = styled.div`
  padding-bottom: 0.25rem;
`;

const MainHeading = styled.h2`
  display: inline-block;
  background: linear-gradient(to right, #211e19, #403b35, #6a6158);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: inherit;
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 700;
  letter-spacing: -0.045em;

  [data-theme='dark'] & {
    background: linear-gradient(to right, #ffffff, #d9d9d7, #b0b8c1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const SubDesc = styled.p`
  margin-top: 0.25rem;
  max-width: 36rem;
  font-size: ${fontSize.xs};
  line-height: 1.25rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  @media (min-width: 640px) {
    font-size: ${fontSize.sm};
  }
`;

const LayoutGrid = styled.div`
  margin-top: 1.25rem;
  display: grid;
  gap: 1.25rem;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    gap: 1.5rem;
  }
`;

const MapStage = styled.div`
  position: relative;
  min-height: 480px;
  padding: 1rem;

  @media (min-width: 640px) {
    min-height: 560px;
    padding: 1.5rem;
  }
`;

const MapHintPill = styled.div`
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 0.875rem;
  font-size: ${fontSize.xs};
  color: ${meok[700]};
  backdrop-filter: blur(4px);

  [data-theme='dark'] & {
    background-color: rgba(36, 33, 29, 0.9);
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    left: 1.5rem;
    top: 1.5rem;
  }
`;

const PulseDot = styled.span`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: ${palette.jangmi[400]};
  animation: ${pulseKeyframe} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const MapSvgWrapper = styled.div`
  position: relative;
  margin: 3.5rem auto 0;
  aspect-ratio: 800 / 759;
  width: 100%;
  max-width: 520px;

  @media (min-width: 640px) {
    margin-top: 3rem;
  }
`;

const StyledSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;

  [data-theme='dark'] & path {
    stroke: rgba(255, 255, 255, 0.25);
  }
`;

const RegionPin = styled.div`
  position: absolute;
  z-index: 10;
  transform: translate(-50%, -50%);
`;

const RegionPinButton = styled.button<{ isActive: boolean }>`
  border: none;
  border-radius: 9999px;
  padding: 0.375rem 0.625rem;
  font-size: ${fontSize.micro};
  font-weight: 600;
  backdrop-filter: blur(4px);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${(props) => (props.isActive ? meok[900] : 'rgba(255, 255, 255, 0.9)')};
  color: ${(props) => (props.isActive ? '#ffffff' : meok[700])};

  [data-theme='dark'] & {
    background-color: ${(props) => (props.isActive ? palette.jangmi[400] : 'rgba(45, 41, 36, 0.9)')};
    color: ${(props) => (props.isActive ? '#ffffff' : meok[200])};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  &:hover {
    background-color: ${(props) => (props.isActive ? meok[900] : '#ffffff')};
    color: ${(props) => (props.isActive ? '#ffffff' : palette.jangmi[400])};

    [data-theme='dark'] & {
      background-color: ${(props) => (props.isActive ? palette.jangmi[500] : surface.dark.elevated)};
      color: ${(props) => (props.isActive ? '#ffffff' : palette.jangmi[400])};
    }
  }

  @media (min-width: 640px) {
    padding: 0.375rem 0.75rem;
    font-size: ${fontSize.xs};
  }
`;

const AsidePanel = styled.aside`
  display: flex;
  height: 480px;
  flex-direction: column;
  border-radius: 1rem;
  background-color: rgba(255, 255, 255, 0.85);
  border: 0.85px solid rgba(205, 205, 202, 0.72);
  box-shadow: none;
  padding: 1rem 0.25rem;
  backdrop-filter: blur(12px);

  [data-theme='dark'] & {
    background-color: rgba(36, 33, 29, 0.88);
    border: 0.85px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  @media (min-width: 640px) {
    height: 560px;
    padding: 1.25rem 0.25rem;
  }
`;

const AsideHeader = styled.div`
  margin: 0 0.5rem;
  padding-bottom: 0.75rem;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
`;

const RegionLabel = styled.h3`
  font-size: ${fontSize.xl};
  font-weight: 800;
  letter-spacing: -0.04em;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StoriesCount = styled.span`
  font-family: monospace;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.jangmi[400]};
`;

const ScrollWrapper = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 0.25rem;
  padding: 0 0.125rem;
`;

const TopGradientFade = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 20;
  height: 17px;
  background: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.8), transparent);

  [data-theme='dark'] & {
    background: linear-gradient(to bottom, rgba(36, 33, 29, 0.95), rgba(36, 33, 29, 0.8), transparent);
  }
`;

const BottomGradientFade = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: 17px;
  background: linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0.8), transparent);

  [data-theme='dark'] & {
    background: linear-gradient(to top, rgba(36, 33, 29, 0.95), rgba(36, 33, 29, 0.8), transparent);
  }
`;

const ScrollContent = styled.div`
  margin-right: -0.25rem;
  height: 100%;
  overflow-y: auto;
  padding: 17px 10px 17px 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StoryItemButton = styled.button<{ isActive: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.875rem;
  border-radius: 0.75rem;
  padding: 0.375rem 0.625rem;
  text-align: left;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${(props) => (props.isActive ? palette.jangmi[50] : 'transparent')};

  &:hover {
    background-color: ${(props) => (props.isActive ? palette.jangmi[50] : meok[200])};
  }

  [data-theme='dark'] & {
    background-color: ${(props) => (props.isActive ? 'rgba(255, 92, 159, 0.2)' : 'transparent')};

    &:hover {
      background-color: ${(props) => (props.isActive ? 'rgba(255, 92, 159, 0.25)' : 'rgba(255, 255, 255, 0.06)')};
    }
  }
`;

const StoryThumb = styled.span`
  position: relative;
  height: 72px;
  width: 72px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8.7px;
  background-color: #f0f0ef;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }

  & img {
    height: 100%;
    width: 100%;
    transform: scale(2.6);
    object-fit: cover;
  }
`;

const StoryInfo = styled.span`
  min-width: 0;
  flex: 1;
  padding-right: 0.25rem;
`;

const StoryHeadRow = styled.span`
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 0.5rem;
`;

const StoryTitle = styled.strong<{ isActive: boolean }>`
  min-width: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;
  line-height: 1.35;
  color: ${(props) => (props.isActive ? palette.jangmi[400] : meok[900])};

  [data-theme='dark'] & {
    color: ${(props) => (props.isActive ? palette.jangmi[400] : meok[100])};
  }
`;

const DurationStatus = styled.span<{ isActive: boolean }>`
  margin-top: 1px;
  flex-shrink: 0;
  font-size: ${fontSize.micro};
  font-weight: 400;
  color: ${(props) => (props.isActive ? palette.jangmi[400] : meok[500])};

  [data-theme='dark'] & {
    color: ${(props) => (props.isActive ? palette.jangmi[400] : meok[400])};
  }
`;

const ExcerptText = styled.span`
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: ${fontSize.micro};
  line-height: 1.4;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const LoadingSpinnerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.jangmi[400]};

  & .spinner {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    border: 2px solid ${palette.jangmi[400]};
    border-top-color: transparent;
    animation: ${spinKeyframe} 1s linear infinite;
  }
`;

const SkeletonShimmer = styled.div`
  background: linear-gradient(90deg, #e4e4e2 25%, #ecece9 50%, #e4e4e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerKeyframe} 1.5s infinite;
`;

const RegionStoryListSkeleton: React.FC = () => (
  <div style={{ marginTop: '0.25rem', flex: 1, overflowY: 'auto', paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }} aria-busy="true" aria-label="지역 오디오 이야기 로딩 중">
    {Array.from({ length: 5 }, (_, index) => (
      <div key={index} style={{ display: 'flex', height: 84, alignItems: 'center', gap: '0.75rem', borderRadius: '0.75rem', padding: '0.375rem 0.625rem' }}>
        <SkeletonShimmer style={{ height: 72, width: 72, flexShrink: 0, borderRadius: '0.75rem' }} />
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonShimmer style={{ height: 14, width: '75%', borderRadius: 4 }} />
          <SkeletonShimmer style={{ height: 10, width: '100%', borderRadius: 4 }} />
          <SkeletonShimmer style={{ height: 10, width: '66%', borderRadius: 4 }} />
        </div>
        <SkeletonShimmer style={{ height: 12, width: 32, flexShrink: 0, borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

function getStoryExcerpt(story: SorimaruStoryItem): string {
  if (story.script && story.script.trim()) {
    const firstSentence = story.script.split(/\r?\n/)[0]?.trim();
    if (firstSentence && firstSentence.length > 3) {
      return firstSentence.length > 70 ? `${firstSentence.slice(0, 70)}…` : firstSentence;
    }
  }
  if (story.audioTitle && story.audioTitle !== story.title) {
    return story.audioTitle;
  }
  return story.locationName ? `${story.locationName}에 남은 오디오 소리 이야기` : '장소에 머무는 아름다운 오디오 이야기';
}

function RegionStoryItem({
  story,
  active,
  isPlaying,
  onClick,
  onMouseEnter,
  onMouseLeave
}: {
  story: SorimaruStoryItem;
  active: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const imgSrc = useSorimaruImage(story);
  return (
    <StoryItemButton
      type="button"
      isActive={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ height: `${VIRTUAL_ITEM_HEIGHT - 8}px` }}
    >
      <StoryThumb>
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getSorimaruFallbackImage(story);
          }}
        />
      </StoryThumb>
      <StoryInfo>
        <StoryHeadRow>
          <StoryTitle isActive={active}>
            {story.title}
          </StoryTitle>
          <DurationStatus isActive={active}>
            {active && isPlaying ? '재생 중' : story.formattedDuration || '3:00'}
          </DurationStatus>
        </StoryHeadRow>
        <ExcerptText>
          {getStoryExcerpt(story)}
        </ExcerptText>
      </StoryInfo>
    </StoryItemButton>
  );
}

export const SoundConstellationSection: React.FC<SoundConstellationSectionProps> = ({ stories }) => {
  const activeApiService = useSorimaruApiService();
  const { ref: viewportRef, isActive: isApiActive } = useViewportActivation<HTMLElement>({
    rootMargin: SOUND_CONSTELLATION_API_ROOT_MARGIN,
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const indicatorThumbRef = useRef<HTMLSpanElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollMetricsRef = useRef<{ scrollTop: number; scrollHeight: number; clientHeight: number } | null>(null);

  const [selectedRegionId, setSelectedRegionId] = useState('seoul');
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [isListHovered, setIsListHovered] = useState(false);
  const [isRegionLoading, setIsRegionLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // 무한 스크롤 및 가상 스크롤 상태
  const [renderScrollTop, setRenderScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const regionStoriesCacheRef = useRef<Record<string, { stories: SorimaruStoryItem[]; page: number; hasMore: boolean }>>({});
  const [regionStoryCounts, setRegionStoryCounts] = useState<Record<string, number>>({});
  const [loadedRegionStories, setLoadedRegionStories] = useState<SorimaruStoryItem[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  const selectedRegion = KOREA_REGION_PATHS.find((region) => region.id === selectedRegionId) || KOREA_REGION_PATHS[0];

  useEffect(() => {
    if (!isApiActive) return;
    let isMounted = true;

    async function loadRegionStories() {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      setRenderScrollTop(0);

      const cached = regionStoriesCacheRef.current[selectedRegionId];
      if (cached && cached.stories.length > 0) {
        setLoadedRegionStories(cached.stories);
        setCurrentPage(cached.page);
        setHasMore(cached.hasMore);
        setIsRegionLoading(false);
        return;
      }

      const localMatch = stories.filter((story) =>
        selectedRegion.keywords.some((keyword) => normalizeText(story).includes(keyword))
      );

      setIsRegionLoading(true);

      try {
        const newStories = await activeApiService.getStoryList(undefined, selectedRegion.keywords[0]);
        if (!isMounted) return;
        let finalStories = newStories.filter((s) => Boolean(s && s.stid));
        if (finalStories.length === 0) {
          finalStories = localMatch.length ? localMatch : stories;
        }

        const hasNext = newStories.length >= 10;
        regionStoriesCacheRef.current[selectedRegionId] = {
          stories: finalStories,
          page: 1,
          hasMore: hasNext,
        };

        setLoadedRegionStories(finalStories);
        setRegionStoryCounts((previous) => ({ ...previous, [selectedRegionId]: finalStories.length }));
        setCurrentPage(1);
        setHasMore(hasNext);
      } catch {
        if (!isMounted) return;
        const fallback = localMatch.length ? localMatch : stories;
        setLoadedRegionStories(fallback);
        setRegionStoryCounts((previous) => ({ ...previous, [selectedRegionId]: fallback.length }));
        setHasMore(false);
      } finally {
        if (isMounted) setIsRegionLoading(false);
      }
    }

    void loadRegionStories();

    return () => {
      isMounted = false;
    };
  }, [selectedRegionId, activeApiService, isApiActive, selectedRegion, stories]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const loadNextPage = useCallback(() => {
    if (isFetchingNextPage || !hasMore || isRegionLoading) return;

    const nextPage = currentPage + 1;
    setIsFetchingNextPage(true);

    activeApiService
      .getStoryList(undefined, selectedRegion.keywords[nextPage % selectedRegion.keywords.length] || selectedRegion.keywords[0])
      .then((moreStories) => {
        if (!moreStories || moreStories.length === 0) {
          setHasMore(false);
          if (regionStoriesCacheRef.current[selectedRegionId]) {
            regionStoriesCacheRef.current[selectedRegionId].hasMore = false;
          }
          return;
        }

        const currentList = regionStoriesCacheRef.current[selectedRegionId]?.stories ?? [];
        const existingIds = new Set(currentList.map((story) => story.stid));
        const uniqueNew = moreStories.filter((story) => story && story.stid && !existingIds.has(story.stid));
        const updatedList = [...currentList, ...uniqueNew];
        const hasNext = moreStories.length >= 10;

        regionStoriesCacheRef.current[selectedRegionId] = {
          stories: updatedList,
          page: nextPage,
          hasMore: hasNext,
        };
        setLoadedRegionStories(updatedList);
        setRegionStoryCounts((previous) => ({ ...previous, [selectedRegionId]: updatedList.length }));
        setHasMore(hasNext);
        setCurrentPage(nextPage);
      })
      .catch(() => {
        setHasMore(false);
      })
      .finally(() => {
        setIsFetchingNextPage(false);
      });
  }, [isFetchingNextPage, hasMore, isRegionLoading, currentPage, activeApiService, selectedRegionId, selectedRegion.keywords]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const currentScrollTop = target.scrollTop;
    const currentScrollHeight = target.scrollHeight;
    const currentClientHeight = target.clientHeight;

    scrollMetricsRef.current = {
      scrollTop: currentScrollTop,
      scrollHeight: currentScrollHeight,
      clientHeight: currentClientHeight,
    };

    if (scrollFrameRef.current === null) {
      scrollFrameRef.current = requestAnimationFrame(() => {
        const metrics = scrollMetricsRef.current;
        scrollFrameRef.current = null;
        if (!metrics) return;

        const trackHeight = Math.max(0, metrics.clientHeight - LIST_EDGE_INSET * 2);
        const thumbHeight = Math.max(18, trackHeight * (metrics.clientHeight / metrics.scrollHeight));
        const maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
        const maxNativeScrollTop = Math.max(1, metrics.scrollHeight - metrics.clientHeight);
        const thumbOffset = (metrics.scrollTop / maxNativeScrollTop) * maxThumbOffset;

        if (indicatorThumbRef.current) {
          indicatorThumbRef.current.style.height = `${thumbHeight}px`;
          indicatorThumbRef.current.style.transform = `translateY(${thumbOffset}px)`;
        }

        setContainerHeight((previous) => previous === metrics.clientHeight ? previous : metrics.clientHeight);
        setRenderScrollTop((previous) => {
          const previousRange = getVirtualRange(previous, metrics.clientHeight, totalCount);
          const nextRange = getVirtualRange(metrics.scrollTop, metrics.clientHeight, totalCount);
          return previousRange.startIndex === nextRange.startIndex && previousRange.endIndex === nextRange.endIndex
            ? previous
            : metrics.scrollTop;
        });
      });
    }

    if (
      currentScrollHeight - (currentScrollTop + currentClientHeight) < 120 &&
      hasMore &&
      !isFetchingNextPage &&
      !isRegionLoading
    ) {
      loadNextPage();
    }
  };

  const regionStories = loadedRegionStories || getRegionStories(stories, selectedRegion);

  const totalCount = regionStories.length;
  const totalHeight = totalCount * VIRTUAL_ITEM_HEIGHT;
  const scrollContentHeight = totalHeight + 34;
  const indicatorTrackHeight = Math.max(0, containerHeight - LIST_EDGE_INSET * 2);
  const canScrollStories = scrollContentHeight > containerHeight;
  const indicatorThumbHeight = canScrollStories
    ? Math.max(18, indicatorTrackHeight * (containerHeight / scrollContentHeight))
    : 0;
  const maxScrollTop = Math.max(1, scrollContentHeight - containerHeight);
  const indicatorThumbOffset = canScrollStories
    ? (renderScrollTop / maxScrollTop) * Math.max(0, indicatorTrackHeight - indicatorThumbHeight)
    : 0;

  const { startIndex, endIndex } = getVirtualRange(renderScrollTop, containerHeight, totalCount);
  const visibleStories = useMemo(
    () => regionStories.slice(startIndex, endIndex),
    [regionStories, startIndex, endIndex]
  );

  const playStory = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <SectionWrapper ref={viewportRef} aria-labelledby="sound-map-heading">
      <InnerContainer>
        <SectionHeader>
          <MainHeading id="sound-map-heading">
            지도로 듣는 이야기
          </MainHeading>
          <SubDesc>
            대한민국 지도에서 지역을 눌러 그곳에 남은 오디오 이야기를 들어보세요.
          </SubDesc>
        </SectionHeader>

        <LayoutGrid>
          <MapStage>
            <MapHintPill>
              <PulseDot /> 지역을 눌러 탐색해보세요
            </MapHintPill>

            <MapSvgWrapper>
              <StyledSvg
                viewBox={KOREA_MAP_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {KOREA_REGION_PATHS.map((region) => {
                  const active = region.id === selectedRegionId;
                  const hovered = region.id === hoveredRegionId;
                  const pathMotion = getRegionPathMotion({ active, hovered, listHovered: isListHovered });
                  return (
                    <motion.path
                      key={region.id}
                      d={region.d}
                      onClick={() => setSelectedRegionId(region.id)}
                      onHoverStart={() => setHoveredRegionId(region.id)}
                      onHoverEnd={() => setHoveredRegionId((current) => (current === region.id ? null : current))}
                      initial={pathMotion}
                      animate={pathMotion}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      stroke={active ? palette.jangmi[400] : '#211e19'}
                      strokeOpacity={active ? 0.5 : 0.18}
                      strokeWidth={active ? 2.4 : 1.4}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </StyledSvg>

              {KOREA_REGION_PATHS.map((region) => {
                const active = region.id === selectedRegionId;
                const count = regionStoryCounts[region.id] ?? getRegionStories(stories, region).length;
                return (
                  <RegionPin
                    key={region.id}
                    style={{ left: `${(region.centroid.x / VB_WIDTH) * 100}%`, top: `${(region.centroid.y / VB_HEIGHT) * 100}%` }}
                  >
                    <RegionPinButton
                      type="button"
                      isActive={active}
                      onClick={() => setSelectedRegionId(region.id)}
                      aria-pressed={active}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {region.shortLabel}
                        <span style={{ color: active ? 'rgba(255, 255, 255, 0.8)' : meok[500] }}>{count}</span>
                      </span>
                    </RegionPinButton>
                  </RegionPin>
                );
              })}
            </MapSvgWrapper>
          </MapStage>

          <AsidePanel aria-live="polite">
            <AsideHeader>
              <RegionLabel>{selectedRegion.label}</RegionLabel>
              <StoriesCount>
                {isRegionLoading ? '조회 중…' : `${regionStories.length}개 이야기`}
              </StoriesCount>
            </AsideHeader>

            {isRegionLoading ? (
              <RegionStoryListSkeleton />
            ) : (
              <ScrollWrapper>
                <TopGradientFade aria-hidden="true" />
                <BottomGradientFade aria-hidden="true" />

                <ScrollContent
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                >
                  <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    <div
                      style={{
                        transform: `translateY(${startIndex * VIRTUAL_ITEM_HEIGHT}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      {visibleStories.map((story) => {
                        const active = currentStory.stid === story.stid;
                        return (
                          <RegionStoryItem
                            key={story.stid}
                            story={story}
                            active={active}
                            isPlaying={isPlaying}
                            onClick={() => playStory(story)}
                            onMouseEnter={() => setIsListHovered(true)}
                            onMouseLeave={() => setIsListHovered(false)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {isFetchingNextPage && (
                    <LoadingSpinnerWrapper>
                      <span className="spinner" />
                      <span>추가 이야기 불러오는 중…</span>
                    </LoadingSpinnerWrapper>
                  )}

                  {!hasMore && regionStories.length > 5 && (
                    <p style={{ padding: '0.75rem 0', textAlign: 'center', fontSize: fontSize.micro, color: meok[500] }}>
                      {selectedRegion.label}의 모든 오디오 이야기를 확인했습니다.
                    </p>
                  )}
                </ScrollContent>

                {canScrollStories && (
                  <div
                    aria-hidden="true"
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      right: 2,
                      top: 23,
                      zIndex: 30,
                      width: 3,
                      borderRadius: 9999,
                      height: `${indicatorTrackHeight}px`,
                    }}
                  >
                    <span
                      ref={indicatorThumbRef}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        borderRadius: 9999,
                        backgroundColor: 'rgba(78, 89, 104, 0.4)',
                        height: `${indicatorThumbHeight}px`,
                        transform: `translateY(${indicatorThumbOffset}px)`,
                      }}
                    />
                  </div>
                )}
              </ScrollWrapper>
            )}
          </AsidePanel>
        </LayoutGrid>
      </InnerContainer>
    </SectionWrapper>
  );
};
