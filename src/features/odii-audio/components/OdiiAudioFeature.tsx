'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList, EditorialStoryListSkeleton } from './EditorialStoryList';
import { OdiiStoryCardGrid } from './OdiiStoryCardGrid';
import { OdiiOriginalStoryList } from './OdiiOriginalStoryList';
import { OdiiArchiveMetaBar } from './OdiiArchiveMetaBar';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { OdiiAutoSliceRail } from './OdiiAutoSliceRail';
import { OdiiEditorialRail } from './OdiiEditorialRail';
import { OdiiFooterCTA } from './OdiiFooterCTA';
import { SoundConstellationSection } from './SoundConstellationSection';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { OdiiAtmosphereBackground } from './OdiiAtmosphereBackground';
import { HanjiTearTransition } from '@/features/odii-audio/background/HanjiTearTransition';
import type { OdiiBackgroundVariant } from '@/features/odii-audio/background/odiiBackground.types';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem, OdiiStoryPage, IOdiiApiService } from '@/features/odii-audio/types/odii.types';
import { OdiiDependencyProvider, useOdiiApiService } from '@/features/odii-audio/context/OdiiDependencyContext';

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export interface OdiiAudioFeatureProps {
  /** 외부에서 주입 가능한 API 서비스 (기본값: odiiApiAdapter) */
  apiService?: IOdiiApiService;
  /** 외부에서 주입받는 아카이브 오디오 스토리 데이터 */
  initialStories?: OdiiStoryItem[];
  /** 외부에서 주입받는 내 주변 오디오 스토리 데이터 */
  initialNearbyStories?: OdiiStoryItem[];
  /** 외부에서 주입받는 히어로 오디오 스토리 세트 */
  initialHeroStorySets?: Record<string, OdiiStoryItem[]>;
  /** 외부 위치 변경 이벤트 콜백 */
  onLocationChange?: (latitude: number, longitude: number) => void;
  /** 비교 시안에서만 사용하는 오디 배경 시스템 */
  backgroundVariant?: OdiiBackgroundVariant;
}

export const OdiiAudioFeature: React.FC<OdiiAudioFeatureProps> = ({
  apiService,
  initialStories,
  initialNearbyStories,
  initialHeroStorySets,
  onLocationChange,
  backgroundVariant,
}) => {
  const activeApiService = useOdiiApiService(apiService);
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const resolvedBackgroundVariant = backgroundVariant ?? 'default';
  const [storyList, setStoryList] = useState<OdiiStoryItem[]>(() => initialStories || []);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>(() => initialNearbyStories || []);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, OdiiStoryItem[]>>(() => initialHeroStorySets || {});
  const [archiveMeta, setArchiveMeta] = useState<OdiiStoryPage>({
    items: initialStories || [],
    pageNo: 1,
    numOfRows: 7,
    totalCount: initialStories?.length || 0,
    source: 'mock',
  });
  const [archivePage, setArchivePage] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 로컬 스토리지 기반 '마음 담은 소리' 스크랩 보관함 관리 (SSR 하이드레이션 안전 처리)
  const [savedStories, setSavedStories] = useState<OdiiStoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('onmaru_saved_odii_stories');
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedStories(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleBookmark = (story: OdiiStoryItem) => {
    setSavedStories((prev) => {
      const exists = prev.some((s) => s.stid === story.stid);
      let updated: OdiiStoryItem[];
      if (exists) {
        updated = prev.filter((s) => s.stid !== story.stid);
      } else {
        updated = [story, ...prev];
      }
      try {
        localStorage.setItem('onmaru_saved_odii_stories', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleRemoveBookmark = (storyId: string) => {
    setSavedStories((prev) => {
      const updated = prev.filter((s) => s.stid !== storyId);
      try {
        localStorage.setItem('onmaru_saved_odii_stories', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const bookmarkedIds = useMemo(() => new Set(savedStories.map((s) => s.stid)), [savedStories]);

  const [isNearbyLoading, setIsNearbyLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const handleApiError = useCallback(() => {
    setApiError('오디 이야기를 불러오지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.');
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialHeroAndNearby() {
      try {
        const [nearby, heroEntries] = await Promise.all([
          activeApiService.getNearbyStories(),
          activeApiService.getStoryList(),
        ]);

        if (isMounted) {
          setNearbyStories(nearby);
          setHeroStorySets({ '추천': heroEntries.slice(0, 7) });
        }
      } catch {
        if (isMounted) setApiError('오디 이야기를 불러오지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.');
      } finally {
        if (isMounted) setIsNearbyLoading(false);
      }
    }

    loadInitialHeroAndNearby();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, retryToken]);

  useEffect(() => {
    let isMounted = true;

    async function fetchArchiveData() {
      setIsArchiveLoading(true);
      try {
        const page = await activeApiService.getStoryPage(selectedCategory, searchQuery, archivePage, 7);

        if (isMounted) {
          if (page.items.length === 0 && archivePage > 1) {
            setArchivePage(1);
            return;
          }
          setStoryList(page.items);
          setArchiveMeta(page);
        }
      } catch {
        if (isMounted) setApiError('오디 이야기를 불러오지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.');
      } finally {
        if (isMounted) setIsArchiveLoading(false);
      }
    }

    fetchArchiveData();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, archivePage, selectedCategory, searchQuery, retryToken]);

  const retryApiRequests = () => {
    setApiError(null);
    setRetryToken((token) => token + 1);
  };

  const totalArchivePages = Math.max(1, Math.ceil(archiveMeta.totalCount / archiveMeta.numOfRows));

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('이 브라우저에서는 위치 기반 이야기를 사용할 수 없습니다.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('현재 위치를 확인하고 주변 이야기를 찾는 중입니다.');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const stories = await activeApiService.getNearbyStories(coords.latitude, coords.longitude);
        if (onLocationChange) onLocationChange(coords.latitude, coords.longitude);
        if (stories.length > 0) {
          setNearbyStories(stories);
          setLocationLabel('현재 위치 기준, 반경 3km');
          setLocationMessage(`${stories.length}개의 이야기를 찾았습니다. 가까운 장소부터 들려드릴게요.`);
        } else {
          setLocationMessage('반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드립니다.');
        }
        setIsLocating(false);
      },
      () => {
        setLocationMessage('위치 권한을 확인하지 못했습니다. 권한 없이도 전국 큐레이션을 둘러볼 수 있어요.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <OdiiDependencyProvider apiService={activeApiService}>
      <div className="odii-feature relative isolate min-h-screen pb-24 text-[#211e19] selection:bg-[#ffd9e4] selection:text-[#b52f55]">
        <OdiiAtmosphereBackground
          variant={backgroundVariant}
          selectedCategory={selectedCategory}
          isPlaying={isPlaying}
        />
        <div className="relative z-10">
          {apiError && (
            <div role="alert" className="fixed left-1/2 top-20 z-[60] flex w-[min(92vw,460px)] -translate-x-1/2 items-center justify-between gap-4 rounded-2xl  bg-[#fffaf3] px-4 py-3 text-sm text-[#655b4d] ">
              <span>{apiError}</span>
              <button type="button" onClick={retryApiRequests} className="shrink-0 rounded-full bg-[#a94d35] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#8e3d2d]">
                다시 시도
              </button>
            </div>
          )}
          <main className="space-y-4 sm:space-y-6">
          {/* 섹션 1: 히어로 큐레이션 레일 (헤더와 적절한 탑 여백 확보) */}
          <motion.div
            data-odii-stage="featured"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="min-h-[520px] pt-24 sm:min-h-[560px] sm:pt-28 lg:pt-32"
          >
            <OdiiAutoSliceRail
              stories={storyList}
              storySets={heroStorySets}
            />
          </motion.div>

          {/* 섹션 2: 한 단어로, 한 장면 */}
          <VesselReveal className="min-h-[650px] sm:min-h-[700px]">
            <div className="mt-4" data-odii-stage="themes">
              <div className="mx-auto max-w-6xl pt-4">
                <h3 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.04em] text-transparent">
                  장면을 따라 걷는 소리
                </h3>
              </div>
              <div className="mt-2">
                <OdiiEditorialRail
                  key={retryToken}
                  stories={storyList}
                  storySets={heroStorySets}
                  apiService={activeApiService}
                  onApiError={handleApiError}
                />
              </div>
            </div>
          </VesselReveal>

          <VesselReveal className="w-full">
            <SoundConstellationSection stories={storyList} />
          </VesselReveal>

          {/* 섹션 3: 오늘, 여기에서 */}
          <HanjiTearTransition stage="nearby" variant={resolvedBackgroundVariant} />
          <VesselReveal className="min-h-[440px] sm:min-h-[470px] w-full py-6 sm:py-8">
            <section
              aria-labelledby="nearby-stories-heading"
              className="w-full"
              data-odii-stage="nearby"
            >
              <div className="mx-auto w-full max-w-6xl">
                <motion.div variants={titleVariants} className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <h2 id="nearby-stories-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.045em] text-transparent">오늘, 여기에서</h2>
                    <p className="mt-1 max-w-xl truncate text-xs sm:text-sm leading-5 text-[#786d5e]">{locationMessage}</p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                    <span className="text-right text-[10px] leading-4 text-[#8c7e6c]">
                      <span className="block">{locationLabel}</span>
                      <strong className="block font-semibold text-[#655b4d]">내 주변 오디오 {nearbyStories.length}개</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleLocate}
                      disabled={isLocating}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full  bg-white/55 px-3 text-[11px] font-medium text-[#655b4d]  transition-transform duration-300 hover:-translate-y-0.5 hover: hover:bg-white hover:text-[#211e19] disabled:cursor-wait disabled:opacity-50"
                    >
                      {isLocating ? '위치 확인 중…' : '내 위치 사용'}
                      {!isLocating && <span aria-hidden="true" className="text-[13px] leading-none">›</span>}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={contentVariants} className="mt-5">
                  <StoryCarousel stories={nearbyStories} isLoading={isNearbyLoading || isLocating} />
                </motion.div>
              </div>
            </section>
          </VesselReveal>

          {/* 오디오 아카이브 섹션 (통합 메인 뷰) */}
          <HanjiTearTransition stage="archive" variant={resolvedBackgroundVariant} />
          <VesselReveal id="odii-archive" className="min-h-[900px] w-full py-8 sm:py-12">
            <section
              className="w-full"
              data-odii-stage="archive"
            >
              <div className="mx-auto w-full max-w-6xl">
                <motion.div variants={titleVariants} className="mb-4">
                  <h2 id="archive-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.045em] text-transparent">
                    오디로 듣는 한국
                  </h2>
                  <p className="mt-1 max-w-xl text-xs sm:text-sm leading-5 text-[#786d5e]">
                    처마 끝 바람 소리부터 천년 고도의 숨결까지, 마음에 머무는 이야기 트랙.
                  </p>
                </motion.div>

                <motion.div variants={contentVariants}>
                  <CategoryTagFilter />
                </motion.div>
                <OdiiArchiveMetaBar resultCount={storyList.length} totalCount={archiveMeta.totalCount} />

                <div className="relative min-h-[600px] overflow-visible">
                  {isArchiveLoading ? (
                    <EditorialStoryListSkeleton />
                  ) : (
                    <EditorialStoryList
                      stories={storyList}
                      onBookmarkStory={handleToggleBookmark}
                      bookmarkedIds={bookmarkedIds}
                    />
                  )}
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row">
                  <span className="text-[11px] text-[#8c7e6c]">
                    {archiveMeta.totalCount > 0 ? `${archiveMeta.totalCount.toLocaleString()}개 중 ${archiveMeta.pageNo}페이지` : '검색 결과 없음'}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsArchiveLoading(true);
                        setArchivePage((page) => Math.max(1, page - 1));
                      }}
                      disabled={archivePage <= 1 || isArchiveLoading}
                      className="h-9 rounded-full px-3.5 text-xs font-semibold text-[#f84e76] transition-colors hover:bg-[#fff0f5] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      이전
                    </button>
                    <span className="min-w-16 text-center text-xs font-semibold text-[#211e19]">{archivePage} / {totalArchivePages}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsArchiveLoading(true);
                        setArchivePage((page) => Math.min(totalArchivePages, page + 1));
                      }}
                      disabled={archivePage >= totalArchivePages || isArchiveLoading}
                      className="h-9 rounded-full px-3.5 text-xs font-semibold text-[#f84e76] transition-colors hover:bg-[#fff0f5] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </VesselReveal>

          {/* 하단 이탈 방지 & 재방문 CTA */}
          <VesselReveal className="min-h-[220px] sm:min-h-[260px]">
            <div data-odii-stage="closing">
              <OdiiFooterCTA />
            </div>
          </VesselReveal>
          </main>
        </div>

      {/* 마음 담은 소리 보관함 (재방문 드라이버) */}
      <SavedSoundDrawer
        savedStories={savedStories}
        onRemoveBookmark={handleRemoveBookmark}
      />

      <LocalMiniPlayer />
      <AllStoriesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allStories={storyList} />
    </div>
    </OdiiDependencyProvider>
  );
};
