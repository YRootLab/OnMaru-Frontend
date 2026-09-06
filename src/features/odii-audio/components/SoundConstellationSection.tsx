'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS, KoreaRegionPath } from '@/features/odii-audio/data/koreaMapPaths';
import { useOdiiApiService } from '@/features/odii-audio/context/OdiiDependencyContext';
import { getVirtualRange, VIRTUAL_ITEM_HEIGHT } from './soundConstellationScroll';
import { useViewportActivation } from '@/shared/hooks/useViewportActivation';
import {
  SOUND_CONSTELLATION_API_ROOT_MARGIN,
  getRegionPathMotion,
} from './soundConstellationMotion';

interface SoundConstellationSectionProps {
  stories: OdiiStoryItem[];
}

const [VB_WIDTH, VB_HEIGHT] = KOREA_MAP_VIEWBOX.split(' ').slice(2).map(Number);
const LIST_EDGE_INSET = 23; // 콘텐츠의 17px 여백 + 카드 내부 6px 패딩과 인디케이터의 시각적 시작점 일치
const STORY_FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

const normalizeText = (story: OdiiStoryItem) => `${story.locationName || ''} ${story.title} ${story.audioTitle || ''} ${story.category || ''}`;
const imageForStory = (story: OdiiStoryItem) => {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return STORY_FALLBACK_IMAGES[seed % STORY_FALLBACK_IMAGES.length];
};
const getRegionStories = (stories: OdiiStoryItem[], region: KoreaRegionPath) => {
  const matched = stories.filter((story) => region.keywords.some((keyword) => normalizeText(story).includes(keyword)));
  return matched.length ? matched : stories.slice(0, 4);
};

// 초기 로딩 시 스켈레톤 UI
const RegionStoryListSkeleton: React.FC = () => (
  <div className="mt-1 flex-1 space-y-1.5 overflow-y-auto pr-1" aria-busy="true" aria-label="지역 오디오 이야기 로딩 중">
    {Array.from({ length: 5 }, (_, index) => (
      <div key={index} className="flex h-[84px] items-center gap-3 rounded-xl px-2.5 py-1.5 bg-transparent">
        <div className="odii-skeleton h-[72px] w-[72px] shrink-0 rounded-xl bg-[#e4e4e2]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="odii-skeleton h-3.5 w-3/4 rounded bg-[#d7d7d4]" />
          <div className="odii-skeleton h-2.5 w-full rounded bg-[#e4e4e2]" />
          <div className="odii-skeleton h-2.5 w-2/3 rounded bg-[#e4e4e2]" />
        </div>
        <div className="odii-skeleton h-3 w-8 shrink-0 rounded bg-[#e4e4e2]" />
      </div>
    ))}
  </div>
);

// 오디오 이야기 스크립트/서사 요약 추출 함수 (텍스트 겹침 방지 가공)
function getStoryExcerpt(story: OdiiStoryItem): string {
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

export const SoundConstellationSection: React.FC<SoundConstellationSectionProps> = ({ stories }) => {
  const activeApiService = useOdiiApiService();
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

  const regionStoriesCacheRef = useRef<Record<string, { stories: OdiiStoryItem[]; page: number; hasMore: boolean }>>({});
  const [regionStoryCounts, setRegionStoryCounts] = useState<Record<string, number>>({});
  const [loadedRegionStories, setLoadedRegionStories] = useState<OdiiStoryItem[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const selectedRegion = KOREA_REGION_PATHS.find((region) => region.id === selectedRegionId) || KOREA_REGION_PATHS[0];

  // 1. 지도 클릭 시 해당 지역 데이터 초기 로딩 (API + 캐시)
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

  // 2. 무한 스크롤 다음 페이지 API 수급 함수
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

  // 3. 스크롤 위치 감지 & 가상 스크롤 업데이트 & 무한 스크롤 트리거
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

    // 하단 100px 이내 접근 시 무한 스크롤 호출
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

  // 4. 가상 스크롤(Virtual Scroll) 표시 범위 계산
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

  const playStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <section ref={viewportRef} aria-labelledby="sound-map-heading" className="w-full py-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="pb-1">
          <h2 id="sound-map-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.045em] text-transparent">
            지도로 듣는 이야기
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm leading-5 text-[#786d5e]">
            대한민국 지도에서 지역을 눌러 그곳에 남은 오디오 이야기를 들어보세요.
          </p>
        </div>

        {/* 복구된 좌측 지도 + 우측 가상 스크롤 리스트 분할 레이아웃 */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-6">
          {/* 좌측 SVG 지도 영역 */}
          <div className="relative min-h-[480px] p-4 sm:min-h-[560px] sm:p-6">
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[#e5e5e3] bg-white/90 px-3.5 py-2 text-[12px] text-[#6b6b68] backdrop-blur-sm sm:left-6 sm:top-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f84e76] animate-pulse" /> 지역을 눌러 탐색해보세요
            </div>

            <div className="relative mx-auto mt-14 aspect-[800/759] w-full max-w-[520px] sm:mt-12">
              <svg
                viewBox={KOREA_MAP_VIEWBOX}
                className="absolute inset-0 h-full w-full overflow-visible"
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
                      stroke={active ? '#f84e76' : '#211e19'}
                      strokeOpacity={active ? 0.5 : 0.18}
                      strokeWidth={active ? 2.4 : 1.4}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="cursor-pointer"
                    />
                  );
                })}
              </svg>

              {KOREA_REGION_PATHS.map((region) => {
                const active = region.id === selectedRegionId;
                const count = regionStoryCounts[region.id] ?? getRegionStories(stories, region).length;
                return (
                  <div
                    key={region.id}
                    style={{ left: `${(region.centroid.x / VB_WIDTH) * 100}%`, top: `${(region.centroid.y / VB_HEIGHT) * 100}%` }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur-sm outline-none transition-all duration-300 sm:px-3 sm:text-xs ${
                        active
                          ? 'bg-[#211e19] text-white shadow-md'
                          : 'bg-white/90 text-[#655b4d] shadow-[0_1px_4px_rgba(33,30,25,0.1)] hover:bg-white hover:text-[#f84e76]'
                      }`}
                      style={active && isListHovered ? { boxShadow: '0 4px 14px rgba(248,78,118,0.55)' } : undefined}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-1.5">
                        {region.shortLabel}
                        <span className={active ? 'text-white/80' : 'text-[#a09587]'}>{count}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측 가상 스크롤 + 무한 스크롤 이야기 리스트 패널 */}
          <aside aria-live="polite" className="flex h-[480px] sm:h-[560px] flex-col rounded-2xl border border-[#211e19]/10 bg-white/85 px-1 py-4 backdrop-blur-md sm:px-1 sm:py-5 shadow-xs">
            <div className="mx-2 pb-3 border-b border-[#211e19]/10 shrink-0">
              <div className="flex items-end justify-between gap-3 px-1">
                <h3 className="text-xl font-extrabold tracking-[-.04em] text-[#211e19]">{selectedRegion.label}</h3>
                <span className="font-mono text-xs font-bold text-[#f84e76]">
                  {isRegionLoading ? '조회 중…' : `${regionStories.length}개 이야기`}
                </span>
              </div>
            </div>

            {isRegionLoading ? (
              <RegionStoryListSkeleton />
            ) : (
              <div className="relative flex-1 min-h-0 overflow-hidden mt-1 px-0.5">
                {/* 얇고 핏한 상/하단 화이트 그라데이션 오버레이 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[17px] bg-gradient-to-b from-white via-white/80 to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[17px] bg-gradient-to-t from-white via-white/80 to-transparent" aria-hidden="true" />

                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="-mr-1 h-full overflow-y-auto px-0.5 pr-[10px] pb-[17px] pt-[17px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {/* 🚀 Virtual Scrolling 컨테이너 */}
                  <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    <div
                      style={{
                        transform: `translateY(${startIndex * VIRTUAL_ITEM_HEIGHT}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                      }}
                      className="space-y-2"
                    >
                      {visibleStories.map((story) => {
                        const active = currentStory.stid === story.stid;
                        return (
                          <button
                            key={story.stid}
                            type="button"
                            onClick={() => playStory(story)}
                            onMouseEnter={() => setIsListHovered(true)}
                            onMouseLeave={() => setIsListHovered(false)}
                            style={{ height: `${VIRTUAL_ITEM_HEIGHT - 8}px` }}
                            className={`flex w-full items-center gap-3.5 rounded-xl px-2.5 py-1.5 text-left transition-all duration-200 ${
                              active
                                ? 'bg-[#fff0f5] ring-1 ring-[#f84e76]/30 shadow-xs'
                                : 'hover:bg-[#f5f5f4]'
                            }`}
                          >
                            <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[8.7px] bg-[#f0f0ef]">
                              <img
                                src={imageForStory(story)}
                                alt=""
                                loading="lazy"
                                className="h-full w-full scale-[2.6] object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = imageForStory({ ...story, imageUrl: '' });
                                }}
                              />
                            </span>
                            <span className="min-w-0 flex-1 pr-1">
                              <span className="flex min-w-0 items-start gap-2">
                                <strong className={`min-w-0 flex-1 line-clamp-2 font-odii-sans text-sm font-bold leading-snug ${active ? 'text-[#f84e76]' : 'text-[#211e19]'}`}>
                                  {story.title}
                                </strong>
                                <span className={`mt-px shrink-0 text-[10px] font-normal ${active ? 'text-[#f84e76]' : 'text-[#a09587]'}`}>
                                  {active && isPlaying ? '재생 중' : story.formattedDuration || '3:00'}
                                </span>
                              </span>
                              <span className="mt-1 block line-clamp-2 text-[10px] leading-[1.4] text-[#786d5e]">
                                {getStoryExcerpt(story)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                {/* 🔄 무한 스크롤 추가 로딩 지디케이터 */}
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#f84e76]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#f84e76] border-t-transparent" />
                    <span>추가 이야기 불러오는 중…</span>
                  </div>
                )}

                {!hasMore && regionStories.length > 5 && (
                  <p className="py-3 text-center text-[10px] text-[#a09587]">
                    {selectedRegion.label}의 모든 오디오 이야기를 확인했습니다.
                  </p>
                )}
                </div>

                {canScrollStories && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[2px] top-[23px] z-30 w-[3px] rounded-full"
                    style={{ height: `${indicatorTrackHeight}px` }}
                  >
                    <span
                      ref={indicatorThumbRef}
                      className="absolute inset-x-0 rounded-full bg-[#8c7e6c]/40"
                      style={{ height: `${indicatorThumbHeight}px`, transform: `translateY(${indicatorThumbOffset}px)` }}
                    />
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};
