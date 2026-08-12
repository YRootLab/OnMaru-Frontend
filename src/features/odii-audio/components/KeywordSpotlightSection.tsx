'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem, IOdiiApiService } from '../types/odii.types';
import { ODII_THEME_CATEGORIES } from '../data/odiiCategoryData';
import { useOdiiApiService } from '../context/OdiiDependencyContext';

interface KeywordSpotlightSectionProps {
  onBookmarkStory?: (story: OdiiStoryItem) => void;
  bookmarkedIds?: Set<string>;
  apiService?: IOdiiApiService;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=82';

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

function getExcerpt(script = ''): string {
  const line = script.split(/\r?\n/).find((item) => item.trim());
  const excerpt = line?.trim() || '장소에 머무는 아름다운 소리를 천천히 들어보세요.';
  return excerpt.length > 150 ? `${excerpt.slice(0, 149)}…` : excerpt;
}

function getTagLabel(label: string): string {
  return label.split('/')[0];
}

function getDailyIndex(length: number, keyword: string): number {
  if (length <= 1) return 0;
  const today = new Date();
  const dateSeed = today.getFullYear() * 372 + today.getMonth() * 31 + today.getDate();
  const keywordSeed = Array.from(keyword).reduce((total, char) => total + char.charCodeAt(0), 0);
  return (dateSeed + keywordSeed) % length;
}

const KeywordSpotlightSkeleton: React.FC = () => (
  <div className="grid min-h-[480px] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
    <article className="grid min-w-0 md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative h-[280px] min-h-[280px] overflow-hidden bg-[#e8ded0] animate-pulse md:h-full md:min-h-[480px]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#211e19]/30 via-transparent to-transparent" />
      </div>
      <div className="flex min-w-0 flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="h-3.5 w-28 bg-[#e5d9c7] animate-pulse rounded" />
          <div className="mt-4 h-8 w-4/5 bg-[#dfd2be] animate-pulse rounded-md" />
          <div className="mt-3 h-4 w-1/2 bg-[#e8ded0] animate-pulse rounded" />
          <div className="mt-8 border-l-2 border-[#a94d35]/30 pl-4 space-y-2.5">
            <div className="h-4 w-full bg-[#e8ded0] animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-[#e8ded0] animate-pulse rounded" />
          </div>
        </div>
        <div className="mt-8 flex items-center gap-4 border-t border-[#211e19]/12 pt-4">
          <div className="h-9 w-32 bg-[#dfd2be] animate-pulse rounded-full" />
          <div className="h-4 w-20 bg-[#e8ded0] animate-pulse rounded" />
        </div>
      </div>
    </article>
    <aside className="border-t border-[#211e19]/12 bg-[#f3ecdf] p-6 sm:p-8 lg:border-l lg:border-t-0">
      <div className="flex items-end justify-between gap-3 border-b border-[#211e19]/12 pb-4">
        <div className="h-4 w-28 bg-[#e5d9c7] animate-pulse rounded" />
        <div className="h-3 w-6 bg-[#e5d9c7] animate-pulse rounded" />
      </div>
      <div className="divide-y divide-[#211e19]/12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-4">
            <div className="h-3 w-4 bg-[#e5d9c7] animate-pulse rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-20 bg-[#e8ded0] animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-[#dfd2be] animate-pulse rounded" />
            </div>
            <div className="h-8 w-8 rounded-full bg-[#e5d9c7] animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </aside>
  </div>
);

export const KeywordSpotlightSection: React.FC<KeywordSpotlightSectionProps> = ({
  onBookmarkStory,
  bookmarkedIds = new Set(),
  apiService,
}) => {
  const activeApiService = useOdiiApiService(apiService);
  const [selectedKeyword, setSelectedKeyword] = useState('한옥');
  const [spotlightStory, setSpotlightStory] = useState<OdiiStoryItem | null>(null);
  const [relatedStories, setRelatedStories] = useState<OdiiStoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    let isMounted = true;

    async function loadSpotlight() {
      setIsLoading(true);
      try {
        const stories = await activeApiService.getStoryList(undefined, selectedKeyword);
        // 실제 API에 음원이 없는 항목은 목업으로 대체하지 않고 미제공 상태로 보여준다.
        const pool = stories.filter((story) => story.audioUrl);
        const main = pool[getDailyIndex(pool.length, selectedKeyword)] || pool[0] || null;
        const connected = pool.filter((story) => story.stid !== main?.stid).slice(0, 3);

        if (isMounted) {
          setSpotlightStory(main);
          setRelatedStories(connected);
        }
      } catch {
        if (isMounted) {
          setSpotlightStory(null);
          setRelatedStories([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSpotlight();
    return () => {
      isMounted = false;
    };
  }, [activeApiService, selectedKeyword]);

  const activeCategory = useMemo(
    () => ODII_THEME_CATEGORIES.find((category) => category.keyword === selectedKeyword) || ODII_THEME_CATEGORIES[0],
    [selectedKeyword],
  );

  const isCurrentPlaying = Boolean(
    spotlightStory && currentStory.stid === spotlightStory.stid && isPlaying,
  );

  const handlePlay = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <section aria-labelledby="keyword-spotlight-heading" className="w-full pt-6 pb-12 sm:pt-8 sm:pb-16 min-h-[580px]">
      <div className="w-full">
        {/* 섹션 2 타이틀 (가장 먼저 등판) */}
        <motion.div variants={titleVariants} className="pb-1">
          <h2 id="keyword-spotlight-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.045em] text-transparent">
            한 단어로, 한 장면
          </h2>
          <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-[#786d5e] sm:text-sm">
            마음이 머무는 주제를 고르면 오늘의 대표 이야기가 열립니다. 내일은 또 다른 장면을 만나보세요.
          </p>
        </motion.div>

        {/* 주제 카테고리 네비게이션 (0.18초 후 지연 등판) */}
        <motion.nav variants={contentVariants} aria-label="이야기 주제" className="mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-x-5 sm:gap-x-7">
            {ODII_THEME_CATEGORIES.map((category) => {
              const isSelected = selectedKeyword === category.keyword;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedKeyword(category.keyword)}
                  aria-pressed={isSelected}
                  className={`border-b pb-2 text-sm transition-colors duration-300 ${
                    isSelected
                      ? 'border-[#a94d35] font-bold text-[#a94d35]'
                      : 'border-transparent font-medium text-[#8c7e6c] hover:border-[#211e19]/25 hover:text-[#211e19]'
                  }`}
                >
                  #{getTagLabel(category.label)}
                </button>
              );
            })}
          </div>
        </motion.nav>

        {/* 대표 이야기 스포트라이트 스테이지 (0.36초 후 순차 등판 / 480px 레이아웃 완벽 고정) */}
        <motion.div variants={contentVariants} className="mt-8 min-h-[480px] overflow-hidden border border-[#211e19]/15 bg-[#fbf7ef]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="spotlight-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <KeywordSpotlightSkeleton />
              </motion.div>
            ) : spotlightStory ? (
              <motion.div
                key={selectedKeyword}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="grid min-h-[480px] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]"
              >
              <article className="grid min-w-0 md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)]">
                <div className="relative h-[280px] min-h-[280px] overflow-hidden bg-[#d9cdbc] md:h-full md:min-h-[480px]">
                  <img
                    src={spotlightStory?.imageUrl || FALLBACK_IMAGE}
                    alt={spotlightStory?.title || '오늘의 대표 이야기'}
                    loading="eager"
                    decoding="sync"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className="h-full w-full object-cover grayscale-[0.12] transition-transform duration-700 hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#211e19]/65 via-transparent to-transparent" />
                  {spotlightStory && (
                    <p className="absolute bottom-5 left-5 right-5 text-xs font-medium leading-5 text-white">
                      {spotlightStory.locationName || '대한민국의 한 장소'}
                    </p>
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-between p-6 sm:p-8">
                  {isLoading ? (
                    <div className="flex flex-1 items-center text-sm text-[#8c7e6c]">이야기를 고르는 중입니다…</div>
                  ) : spotlightStory ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-[#a94d35]">{activeCategory.description}</p>
                        <h3 className="mt-3 font-odii-sans text-2xl font-bold leading-tight tracking-[-0.045em] text-[#211e19] sm:text-3xl">
                          {spotlightStory.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#655b4d]">{spotlightStory.audioTitle}</p>
                        <blockquote className="mt-7 border-l-2 border-[#a94d35]/60 pl-4 font-odii-sans text-lg leading-8 text-[#403a31] sm:text-xl">
                          “{getExcerpt(spotlightStory.script)}”
                        </blockquote>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#211e19]/12 pt-4">
                        <button
                          type="button"
                          onClick={() => handlePlay(spotlightStory)}
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#a94d35] transition-colors hover:text-[#211e19]"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a94d35] text-white">
                            {isCurrentPlaying ? (
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4v14h-4V5z" /></svg>
                            ) : (
                              <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                            )}
                          </span>
                          {isCurrentPlaying ? '잠시 멈추기' : '이야기 듣기'}
                          <span className="font-mono text-[11px] font-normal text-[#8c7e6c]">{spotlightStory.formattedDuration || '오디오'}</span>
                        </button>

                        {onBookmarkStory && (
                          <button
                            type="button"
                            onClick={() => onBookmarkStory(spotlightStory)}
                            aria-pressed={bookmarkedIds.has(spotlightStory.stid)}
                            className={`text-xs font-semibold transition-colors ${bookmarkedIds.has(spotlightStory.stid) ? 'text-[#a94d35]' : 'text-[#8c7e6c] hover:text-[#a94d35]'}`}
                          >
                            {bookmarkedIds.has(spotlightStory.stid) ? '♥ 담아둔 소리' : '♡ 마음에 담기'}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#8c7e6c]">아직 이 주제의 이야기가 준비되지 않았어요.</p>
                  )}
                </div>
              </article>

              <aside className="border-t border-[#211e19]/12 bg-[#f3ecdf] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="flex items-end justify-between gap-3 border-b border-[#211e19]/12 pb-4">
                  <div>
                    <p className="text-xs font-semibold text-[#a94d35]">이어지는 소리</p>
                    <h3 className="mt-1 font-odii-sans text-xl font-bold tracking-[-0.04em] text-[#211e19]">함께 들으면 좋은 장면</h3>
                  </div>
                  <span className="font-mono text-[10px] text-[#8c7e6c]">{String(relatedStories.length).padStart(2, '0')}</span>
                </div>

                <div className="divide-y divide-[#211e19]/12">
                  {relatedStories.map((story, index) => {
                    const isRelatedPlaying = currentStory.stid === story.stid && isPlaying;
                    return (
                      <div key={story.stid} className="flex items-center gap-3 py-4">
                        <span className="font-mono text-xs text-[#a94d35]">0{index + 1}</span>
                        <button type="button" onClick={() => handlePlay(story)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[10px] text-[#8c7e6c]">{story.locationName || '소리의 장소'}</span>
                          <span className="mt-1 block truncate font-odii-sans text-sm font-bold text-[#211e19]">{story.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlay(story)}
                          aria-label={`${story.title} ${isRelatedPlaying ? '일시정지' : '재생'}`}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${isRelatedPlaying ? 'border-[#a94d35] bg-[#a94d35] text-white' : 'border-[#211e19]/20 text-[#211e19] hover:border-[#a94d35] hover:text-[#a94d35]'}`}
                        >
                          {isRelatedPlaying ? (
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14h4v14h-4V5z" /></svg>
                          ) : (
                            <svg className="ml-0.5 h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </aside>
            </motion.div>
          ) : (
            <motion.div
              key={`spotlight-empty-${selectedKeyword}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[480px] items-center justify-center px-6 text-center"
            >
              <div>
                <p className="text-sm font-semibold text-[#655b4d]">이 주제의 오디오가 아직 준비되지 않았어요.</p>
                <p className="mt-1 text-xs text-[#8c7e6c]">다른 주제를 선택해 새로운 이야기를 찾아보세요.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
