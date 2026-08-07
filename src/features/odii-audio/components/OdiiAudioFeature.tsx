'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { ZIndexStackedSection } from './ZIndexStackedSection';
import { OdiiAutoSliceRail } from './OdiiAutoSliceRail';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { OdiiAtmosphereBackground } from './OdiiAtmosphereBackground';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { odiiApiAdapter } from '../api/odiiApi';
import { MOCK_ODII_STORIES } from '../api/odiiMockData';
import { OdiiStoryItem, OdiiStoryPage } from '../types/odii.types';
import { ODII_CHAPTER_DEFINITIONS } from '../data/odiiChapterData';
import { ODII_HERO_TABS } from '../data/odiiCategoryData';
import { OdiiChapterPresentation } from '../types/odiiChapter.types';

const CHAPTER_FALLBACK_TERMS: Record<string, string[]> = {
  hanok: ['한옥', '고택', '한옥마을', '마루'],
  seowon: ['서원', '향교', '선비', '서당', '유교'],
  market: ['시장', '장터', '시전', '전통시장', '사람'],
  temple: ['사찰', '산사', '절', '사원', '종소리'],
};

function getStorySearchText(story: OdiiStoryItem): string {
  return [story.category, story.title, story.audioTitle, story.locationName]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

function scoreFallbackStory(story: OdiiStoryItem, chapterId: string): number {
  const searchableText = getStorySearchText(story);
  return (CHAPTER_FALLBACK_TERMS[chapterId] || []).reduce(
    (score, term) => score + (searchableText.includes(term) ? 1 : 0),
    0,
  );
}

function normalizeChapterPresentations(
  chapterStories: Record<string, OdiiStoryItem | null>,
  chapterStorySets: Record<string, OdiiStoryItem[]>,
  fallbackStories: OdiiStoryItem[],
): OdiiChapterPresentation[] {
  const storyPool = Array.from(new Map(fallbackStories.map((story) => [story.stid, story])).values());
  const usedStoryIds = new Set<string>();

  return ODII_CHAPTER_DEFINITIONS.map((definition) => {
    const apiStory = chapterStories[definition.keyword];
    const exactFallback = storyPool
      .filter((story) => !usedStoryIds.has(story.stid) && story.audioUrl)
      .sort((left, right) => scoreFallbackStory(right, definition.id) - scoreFallbackStory(left, definition.id))[0];
    const story = apiStory && !usedStoryIds.has(apiStory.stid) ? apiStory : exactFallback || null;
    const relatedStories = (chapterStorySets[definition.keyword] || [])
      .filter((relatedStory) => relatedStory.audioUrl && !usedStoryIds.has(relatedStory.stid))
      .slice(0, 2);
    const stories = Array.from(
      new Map([story, ...relatedStories].filter((item): item is OdiiStoryItem => Boolean(item)).map((item) => [item.stid, item])).values(),
    ).slice(0, 2);

    stories.forEach((item) => usedStoryIds.add(item.stid));
    return { ...definition, story: stories[0] || story, stories };
  });
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
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
      duration: 0.95,
      ease: [0.12, 1, 0.2, 1],
    },
  },
};

export const OdiiAudioFeature: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const [storyList, setStoryList] = useState<OdiiStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>([]);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, OdiiStoryItem[]>>({});
  const [chapterStories, setChapterStories] = useState<Record<string, OdiiStoryItem | null>>({});
  const [chapterStorySets, setChapterStorySets] = useState<Record<string, OdiiStoryItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [archiveMeta, setArchiveMeta] = useState<OdiiStoryPage>({
    items: [],
    pageNo: 1,
    numOfRows: 12,
    totalCount: 0,
    source: 'mock',
  });
  const [archivePage, setArchivePage] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadArchive() {
      setIsLoading(true);
      const page = await odiiApiAdapter.getStoryPage(selectedCategory, searchQuery, archivePage, 12);
      if (isMounted) {
        if (page.items.length === 0 && archivePage > 1) {
          setArchivePage(1);
          return;
        }
        setStoryList(page.items);
        setArchiveMeta(page);
        setIsLoading(false);
      }
    }
    loadArchive();
    return () => { isMounted = false; };
  }, [archivePage, selectedCategory, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    odiiApiAdapter.getNearbyStories().then((stories) => {
      if (isMounted) setNearbyStories(stories);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      ODII_HERO_TABS.map(async (tab) => {
        const stories = await odiiApiAdapter.getStoryList(undefined, tab.keyword || undefined);
        const combined = tab.id === '추천'
          ? MOCK_ODII_STORIES.slice(0, 7)
          : (stories.length >= 7
              ? stories.slice(0, 7)
              : [...stories, ...MOCK_ODII_STORIES.filter((m) => !stories.some((s) => s.stid === m.stid))].slice(0, 7));
        return [tab.id, combined] as const;
      }),
    ).then((entries) => {
      if (isMounted) setHeroStorySets(Object.fromEntries(entries));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    odiiApiAdapter
      .getChapterStorySets(
        ODII_CHAPTER_DEFINITIONS.map((chapter) => chapter.keyword),
        MOCK_ODII_STORIES,
      )
      .then((storySets) => {
        if (isMounted) {
          setChapterStorySets(storySets);
          setChapterStories(
            Object.fromEntries(
              Object.entries(storySets).map(([keyword, stories]) => [keyword, stories[0] || null]),
            ),
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const chapterFallbackStories = useMemo(
    () => [...storyList, ...nearbyStories, ...MOCK_ODII_STORIES],
    [nearbyStories, storyList],
  );
  const chapters = useMemo(
    () => normalizeChapterPresentations(chapterStories, chapterStorySets, chapterFallbackStories),
    [chapterFallbackStories, chapterStories, chapterStorySets],
  );
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
        const stories = await odiiApiAdapter.getNearbyStories(String(coords.longitude), String(coords.latitude));
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
    <div className="odii-feature relative isolate min-h-screen pb-24 text-[#211e19] selection:bg-[#d56748] selection:text-white">
      <OdiiAtmosphereBackground />
      <div className="relative z-10">
        <main>
          {/* 섹션 0: 상단 인트로 헤더 — 0.0초 진입 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            style={{ willChange: 'transform, opacity' }}
            className="w-full pb-6 pt-8 sm:pt-10"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <div className="max-w-xl">
                <motion.h1 variants={childVariants} className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                  소리를 따라, 한국의 온기 속으로
                </motion.h1>
                <motion.p variants={childVariants} className="mt-2 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                  바람이 머무는 한옥, 사람의 온기가 흐르는 시장, 오래된 골목의 시간을 오디오로 천천히 만나보세요.
                </motion.p>
              </div>
            </div>
          </motion.section>

          {/* 섹션 1: 메인 자동 슬라이스 레일 — 0.12초 진입 (최우선) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 1.2,
                  delay: 0.12,
                  ease: [0.12, 1, 0.2, 1],
                  staggerChildren: 0.08,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            style={{ willChange: 'transform, opacity' }}
          >
            <OdiiAutoSliceRail
              stories={storyList.length ? storyList : (nearbyStories.length ? nearbyStories : MOCK_ODII_STORIES)}
              storySets={heroStorySets}
            />
          </motion.div>

          {/* 섹션 2: 챕터별 오디오 트랙 스태킹 섹션 — 섹션 1 등장 후 약 0.3초 뒤 (0.42초) 스크롤 없이도 자연스럽게 순차 바인딩 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 1.2,
                  delay: 0.42,
                  ease: [0.12, 1, 0.2, 1],
                  staggerChildren: 0.08,
                  delayChildren: 0.06,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            style={{ willChange: 'transform, opacity' }}
          >
            <ZIndexStackedSection
              chapters={chapters}
            />
          </motion.div>

          {/* 섹션 3: 오늘, 여기에서 캐러셀 — 스크롤 타이밍 약 0.2초 앞당김 (amount: 0.12, margin: -20px) */}
          <motion.section
            aria-labelledby="nearby-stories-heading"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -20px 0px' }}
            style={{ willChange: 'transform, opacity' }}
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
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#211e19]/12 bg-white/55 px-3 text-[11px] font-medium text-[#655b4d] shadow-[0_3px_12px_rgba(61,45,29,0.04)] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#211e19]/25 hover:bg-white hover:text-[#211e19] disabled:cursor-wait disabled:opacity-50"
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

          {/* 섹션 4: 페이지형 이야기 아카이브 — 스크롤 타이밍 약 0.2초 앞당김 (amount: 0.12, margin: -20px) */}
          <motion.section
            id="odii-archive"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -20px 0px' }}
            style={{ willChange: 'transform, opacity' }}
            className="w-full bg-white py-10 sm:py-14"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
              <motion.div variants={childVariants} className="max-w-xl">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold tracking-[-0.045em] text-transparent sm:text-3xl">더 많은 이야기</h2>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                  장소와 지역, 키워드로 듣고 싶은 이야기를 찾아보세요.
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
                    <EditorialStoryList stories={storyList} />
                  </motion.div>
                  <motion.div variants={childVariants} className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#211e19]/10 pt-4 sm:flex-row">
                    <span className="text-[11px] text-[#8c7e6c]">
                      {archiveMeta.totalCount > 0 ? `${archiveMeta.totalCount.toLocaleString()}개 중 ${archiveMeta.pageNo}페이지` : '검색 결과 없음'}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-[#211e19]/12 bg-white/60 px-3 py-1.5 text-[11px] font-medium text-[#655b4d] shadow-[0_3px_12px_rgba(61,45,29,0.04)] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#211e19]/25 hover:bg-white hover:text-[#211e19]"
                      >
                        모든 이야기 <span aria-hidden="true" className="text-[13px] leading-none">›</span>
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

        </main>
      </div>

      <LocalMiniPlayer />
      <AllStoriesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allStories={storyList} />
    </div>
  );
};

