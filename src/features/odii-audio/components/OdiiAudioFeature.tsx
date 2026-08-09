'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList, EditorialStoryListSkeleton } from './EditorialStoryList';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { OdiiAutoSliceRail } from './OdiiAutoSliceRail';
import { OdiiEditorialRail } from './OdiiEditorialRail';
import { OdiiFooterCTA } from './OdiiFooterCTA';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { OdiiAtmosphereBackground } from './OdiiAtmosphereBackground';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { MOCK_ODII_STORIES } from '../api/odiiMockData';
import { OdiiStoryItem, OdiiStoryPage, IOdiiApiService } from '../types/odii.types';
import { OdiiDependencyProvider, useOdiiApiService } from '../context/OdiiDependencyContext';

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.38,
      delayChildren: 0.08,
    },
  },
};

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

const childVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.95,
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
}

export const OdiiAudioFeature: React.FC<OdiiAudioFeatureProps> = ({
  apiService,
  initialStories,
  initialNearbyStories,
  initialHeroStorySets,
  onLocationChange,
}) => {
  const activeApiService = useOdiiApiService(apiService);
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const [storyList, setStoryList] = useState<OdiiStoryItem[]>(() => initialStories || MOCK_ODII_STORIES);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>(() => initialNearbyStories || []);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, OdiiStoryItem[]>>(() => initialHeroStorySets || {
    '추천': MOCK_ODII_STORIES.slice(0, 7),
  });
  const [archiveMeta, setArchiveMeta] = useState<OdiiStoryPage>({
    items: initialStories || MOCK_ODII_STORIES,
    pageNo: 1,
    numOfRows: 7,
    totalCount: (initialStories || MOCK_ODII_STORIES).length,
    source: 'mock',
  });
  const [archivePage, setArchivePage] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 세션 스토리지 기반 애니메이션 1회 실행 기억 (새로고침 F5 시 애니메이션 재실행 100% 차단)
  const [hasAnimatedSession] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('onmaru_odii_has_animated_session') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasAnimatedSession) {
      try {
        sessionStorage.setItem('onmaru_odii_has_animated_session', 'true');
      } catch {
        // ignore
      }
    }
  }, [hasAnimatedSession]);

  // 로컬 스토리지 기반 '마음 담은 소리' 스크랩 보관함 관리 (재방문 유지)
  const [savedStories, setSavedStories] = useState<OdiiStoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('onmaru_saved_odii_stories');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

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

  // 1. 페이지 최초 마운트 시 히어로 탭 및 주변 이야기 1회만 로드
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
      } finally {
        if (isMounted) setIsNearbyLoading(false);
      }
    }

    loadInitialHeroAndNearby();

    return () => {
      isMounted = false;
    };
  }, [activeApiService]);

  // 2. 섹션 4 아카이브 페이지네이션 및 카테고리/검색어 독립적 쾌속 업데이트 (초기 마운트 시 0ms 렌더링 유지)
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
          setStoryList(page.items.length ? page.items : MOCK_ODII_STORIES);
          setArchiveMeta(page);
        }
      } finally {
        if (isMounted) setIsArchiveLoading(false);
      }
    }

    fetchArchiveData();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, archivePage, selectedCategory, searchQuery]);

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
        <OdiiAtmosphereBackground />
        <div className="relative z-10">
          <main>
            {/* 섹션 0: 헤더 타이틀 (새로고침 시 애니메이션 완전 생략) */}
          <motion.section
            variants={sectionVariants}
            initial={hasAnimatedSession ? false : "hidden"}
            animate="visible"
            className="w-full pb-4 pt-8 sm:pt-10"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <div className="max-w-xl">
                <motion.h1 variants={childVariants} className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                  오늘의 추천
                </motion.h1>
                <motion.p variants={childVariants} className="mt-2 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                  오늘은 어떤 장소의 이야기를 들어볼까요? 오디가 골라온 한국의 소리를 만나보세요.
                </motion.p>
              </div>
            </div>
          </motion.section>

          {/* 섹션 1: 히어로 큐레이션 레일 (새로고침 시 즉시 노출 / 420px 레이아웃 고정) */}
          <motion.div
            initial={hasAnimatedSession ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={hasAnimatedSession ? { duration: 0 } : {
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.20,
            }}
            className="min-h-[360px] sm:min-h-[420px]"
          >
            <OdiiAutoSliceRail
              stories={storyList.length ? storyList : (nearbyStories.length ? nearbyStories : MOCK_ODII_STORIES)}
              storySets={heroStorySets}
            />
          </motion.div>

          {/* 섹션 2: 한 단어로, 한 장면 (새로고침 시 즉시 노출 / 660px 레이아웃 완벽 고정) */}
          <motion.div
            variants={sectionVariants}
            initial={hasAnimatedSession ? false : "hidden"}
            whileInView={hasAnimatedSession ? undefined : "visible"}
            animate={hasAnimatedSession ? "visible" : undefined}
            viewport={hasAnimatedSession ? undefined : { once: true, amount: 0.15 }}
            transition={hasAnimatedSession ? { duration: 0 } : undefined}
            className="min-h-[650px] sm:min-h-[700px]"
          >
            <div className="mt-4">
              <div className="mx-auto max-w-6xl px-4 sm:px-8">
                <h3 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.04em] text-transparent sm:text-3xl">장면을 골라 듣다</h3>
              </div>
              <div className="mt-1">
                <OdiiEditorialRail
                  stories={storyList.length ? storyList : (nearbyStories.length ? nearbyStories : MOCK_ODII_STORIES)}
                  storySets={heroStorySets}
                  apiService={activeApiService}
                />
              </div>
            </div>
          </motion.div>

          {/* 섹션 3: 오늘, 여기에서 (새로고침 시 즉시 노출 / 380px 레이아웃 고정) */}
          <motion.section
            aria-labelledby="nearby-stories-heading"
            variants={sectionVariants}
            initial={hasAnimatedSession ? false : "hidden"}
            whileInView={hasAnimatedSession ? undefined : "visible"}
            animate={hasAnimatedSession ? "visible" : undefined}
            viewport={hasAnimatedSession ? undefined : { once: true, amount: 0.12 }}
            transition={hasAnimatedSession ? { duration: 0 } : undefined}
            className="h-[420px] w-full overflow-hidden py-8 sm:py-12"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              {/* 섹션 3 타이틀 (가장 먼저 등판) */}
              <motion.div variants={titleVariants} className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h2 id="nearby-stories-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.045em] text-transparent sm:text-3xl">오늘, 여기에서</h2>
                  <p className="mt-1 max-w-xl truncate text-xs leading-5 text-[#786d5e]">{locationMessage}</p>
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
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#211e19]/12 bg-white/55 px-3 text-[11px] font-medium text-[#655b4d] shadow-xs transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#211e19]/25 hover:bg-white hover:text-[#211e19] disabled:cursor-wait disabled:opacity-50"
                  >
                    {isLocating ? '위치 확인 중…' : '내 위치 사용'}
                    {!isLocating && <span aria-hidden="true" className="text-[13px] leading-none">›</span>}
                  </button>
                </div>
              </motion.div>

              {/* 섹션 3 캐러셀 컴포넌트 (F5 새로고침 및 위치 조회 중 스켈레톤 즉시 발동) */}
              <motion.div variants={contentVariants} className="mt-5">
                <StoryCarousel stories={nearbyStories} isLoading={isNearbyLoading || isLocating} />
              </motion.div>
            </div>
          </motion.section>

          {/* 섹션 4: 주제와 장소를 따라보는 이야기 아카이브 (7개 단위 / 위치 고정) */}
          <motion.section
            id="odii-archive"
            variants={sectionVariants}
            initial={hasAnimatedSession ? false : "hidden"}
            whileInView={hasAnimatedSession ? undefined : "visible"}
            animate={hasAnimatedSession ? "visible" : undefined}
            viewport={hasAnimatedSession ? undefined : { once: true, amount: 0.12 }}
            transition={hasAnimatedSession ? { duration: 0 } : undefined}
            className="h-[1040px] w-full overflow-hidden bg-white py-10 sm:py-14"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              {/* 섹션 4 타이틀 & 서브타이틀 */}
              <motion.div variants={titleVariants} className="mb-4">
                <h2 id="archive-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.045em] text-transparent sm:text-3xl">
                  주제와 장소를 따라보는 이야기
                </h2>
                <p className="mt-1 max-w-xl text-xs leading-5 text-[#786d5e]">
                  원하는 테마와 장소를 선택하여 전국 문화유산을 담은 오디오 도슨트를 자유롭게 둘러보세요.
                </p>
              </motion.div>

              {/* 카테고리 태그 필터 */}
              <motion.div variants={contentVariants}>
                <CategoryTagFilter />
              </motion.div>

              {/* 오디오 아카이브 카드 리스트 (7개 단위 / 높이 고정) */}
              <div className="relative h-[600px] overflow-hidden">
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

              {/* 하단 페이지네이션 (페이지 변경 시 레이아웃 시프트 없이 즉시 업데이트) */}
              <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#211e19]/10 pt-4 sm:flex-row">
                <span className="text-[11px] text-[#8c7e6c]">
                  {archiveMeta.totalCount > 0 ? `${archiveMeta.totalCount.toLocaleString()}개 중 ${archiveMeta.pageNo}페이지` : '검색 결과 없음'}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-[#211e19]/12 bg-white/60 px-3 py-1.5 text-[11px] font-medium text-[#655b4d] shadow-xs transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#211e19]/25 hover:bg-white hover:text-[#211e19]"
                  >
                    전체 목록 보기 <span aria-hidden="true" className="text-[13px] leading-none">›</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsArchiveLoading(true);
                      setArchivePage((page) => Math.max(1, page - 1));
                    }}
                    disabled={archivePage <= 1 || isArchiveLoading}
                    className="h-9 rounded-full border border-[#211e19]/15 px-3 text-xs font-semibold text-[#211e19] transition-colors hover:border-[#a94d35] hover:text-[#a94d35] disabled:cursor-not-allowed disabled:opacity-30"
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
                    className="h-9 rounded-full border border-[#211e19]/15 px-3 text-xs font-semibold text-[#211e19] transition-colors hover:border-[#a94d35] hover:text-[#a94d35] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 섹션 5: 이탈 방지 & 재방문 CTA (새로고침 시 즉시 노출 / 260px 고정) */}
          <motion.div
            variants={sectionVariants}
            initial={hasAnimatedSession ? false : "hidden"}
            whileInView={hasAnimatedSession ? undefined : "visible"}
            animate={hasAnimatedSession ? "visible" : undefined}
            viewport={hasAnimatedSession ? undefined : { once: true, amount: 0.1 }}
            transition={hasAnimatedSession ? { duration: 0 } : undefined}
            className="min-h-[220px] sm:min-h-[260px]"
          >
            <OdiiFooterCTA />
          </motion.div>
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
