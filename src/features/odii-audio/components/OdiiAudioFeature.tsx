'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { KeywordSpotlightSection } from './KeywordSpotlightSection';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { OdiiAutoSliceRail } from './OdiiAutoSliceRail';
import { OdiiFooterCTA } from './OdiiFooterCTA';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { OdiiAtmosphereBackground } from './OdiiAtmosphereBackground';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { MOCK_ODII_STORIES } from '../api/odiiMockData';
import { OdiiStoryItem, OdiiStoryPage, IOdiiApiService } from '../types/odii.types';
import { ODII_HERO_TABS } from '../data/odiiCategoryData';
import { OdiiDependencyProvider, useOdiiApiService } from '../context/OdiiDependencyContext';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.1,
      ease: [0.12, 1, 0.2, 1],
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.12, 1, 0.2, 1],
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
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>(() => initialNearbyStories || MOCK_ODII_STORIES);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, OdiiStoryItem[]>>(() => initialHeroStorySets || {
    '추천': MOCK_ODII_STORIES.slice(0, 7),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [archiveMeta, setArchiveMeta] = useState<OdiiStoryPage>({
    items: initialStories || MOCK_ODII_STORIES,
    pageNo: 1,
    numOfRows: 12,
    totalCount: (initialStories || MOCK_ODII_STORIES).length,
    source: 'mock',
  });
  const [archivePage, setArchivePage] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      setIsLoading(true);
      const [page, nearby, heroEntries] = await Promise.all([
        activeApiService.getStoryPage(selectedCategory, searchQuery, archivePage, 12),
        activeApiService.getNearbyStories(),
        Promise.all(
          ODII_HERO_TABS.map(async (tab) => {
            const stories = await activeApiService.getStoryList(undefined, tab.keyword || undefined);
            const combined = tab.id === '추천'
              ? MOCK_ODII_STORIES.slice(0, 7)
              : (stories.length >= 7
                  ? stories.slice(0, 7)
                  : [...stories, ...MOCK_ODII_STORIES.filter((m) => !stories.some((s) => s.stid === m.stid))].slice(0, 7));
            return [tab.id, combined] as const;
          }),
        ),
      ]);

      if (isMounted) {
        if (page.items.length === 0 && archivePage > 1) {
          setArchivePage(1);
          return;
        }
        setStoryList(page.items.length ? page.items : MOCK_ODII_STORIES);
        setArchiveMeta(page);
        if (nearby.length) setNearbyStories(nearby);
        setHeroStorySets(Object.fromEntries(heroEntries));
        setIsLoading(false);
      }
    }

    loadAllData();

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
          setLocationLabel('현재 위치 기준 · 반경 3km');
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
      <div className="odii-feature relative isolate min-h-screen pb-24 text-[#211e19] selection:bg-[#a94d35] selection:text-white">
        <OdiiAtmosphereBackground />
        <div className="relative z-10">
          <main>
            {/* 섹션 0: 헤더 타이틀 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="w-full pb-4 pt-8 sm:pt-10"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <div className="max-w-xl">
                <motion.h1 variants={childVariants} className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                  소리를 따라, 한국의 온기 속으로
                </motion.h1>
                <motion.p variants={childVariants} className="mt-2 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                  바람이 머무는 한옥, 사람의 온기가 흐르는 시장, 오래된 골목의 시간을 오디오 도슨트로 천천히 만나보세요.
                </motion.p>
              </div>
            </div>
          </motion.section>

          {/* 섹션 1: 히어로 큐레이션 레일 */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <OdiiAutoSliceRail
              stories={storyList.length ? storyList : (nearbyStories.length ? nearbyStories : MOCK_ODII_STORIES)}
              storySets={heroStorySets}
            />
          </motion.div>

          {/* 섹션 2: 키워드에서 대표 이야기로 이어지는 스포트라이트 */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <KeywordSpotlightSection
              onBookmarkStory={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />
          </motion.div>

          {/* 섹션 3: 오늘, 여기에서 (고정 위치 기반 주변 오디오 캐러셀) */}
          <motion.section
            aria-labelledby="nearby-stories-heading"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="w-full py-8 sm:py-12"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <motion.div variants={childVariants} className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h2 id="nearby-stories-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.045em] text-transparent sm:text-3xl">오늘, 여기에서</h2>
                  <p className="mt-1 max-w-xl truncate text-xs leading-5 text-[#786d5e]">{locationMessage}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="text-[10px] text-[#8c7e6c]">{locationLabel} · <strong className="font-semibold text-[#655b4d]">내 주변 오디오 {nearbyStories.length}개</strong></span>
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
              <motion.div variants={childVariants} className="mt-5">
                <StoryCarousel stories={nearbyStories.length ? nearbyStories : MOCK_ODII_STORIES} />
              </motion.div>
            </div>
          </motion.section>

          {/* 섹션 4/5: 주제와 장소를 따라보는 이야기 아카이브 */}
          <motion.section
            id="odii-archive"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="w-full bg-white py-10 sm:py-14"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <motion.div variants={childVariants} className="max-w-xl">
                <h2 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.045em] text-transparent sm:text-3xl">
                  이야기를 더 둘러보기
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                  한옥, 정, 시장, 골목처럼 마음이 가는 주제에서 다음 장소를 찾아보세요.
                </p>
              </motion.div>

              <motion.div variants={childVariants}>
                <CategoryTagFilter />
              </motion.div>

              {isLoading ? (
                <div className="py-16 text-center text-xs text-[#655b4d]">이야기를 불러오는 중입니다...</div>
              ) : (
                <>
                  <motion.div variants={childVariants}>
                    <EditorialStoryList
                      stories={storyList}
                      onBookmarkStory={handleToggleBookmark}
                      bookmarkedIds={bookmarkedIds}
                    />
                  </motion.div>

                  {/* 하단 페이지네이션 */}
                  <motion.div variants={childVariants} className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#211e19]/10 pt-4 sm:flex-row">
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
                        onClick={() => setArchivePage((page) => Math.max(1, page - 1))}
                        disabled={archivePage <= 1}
                        className="h-9 rounded-full border border-[#211e19]/15 px-3 text-xs font-semibold text-[#211e19] transition-colors hover:border-[#a94d35] hover:text-[#a94d35] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        이전
                      </button>
                      <span className="min-w-16 text-center text-xs font-semibold text-[#211e19]">{archivePage} / {totalArchivePages}</span>
                      <button
                        type="button"
                        onClick={() => setArchivePage((page) => Math.min(totalArchivePages, page + 1))}
                        disabled={archivePage >= totalArchivePages}
                        className="h-9 rounded-full border border-[#211e19]/15 px-3 text-xs font-semibold text-[#211e19] transition-colors hover:border-[#a94d35] hover:text-[#a94d35] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        다음
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.section>

          {/* 섹션 6: 이탈 방지 & 재방문 CTA */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
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
