'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';
import { ODII_HERO_TABS } from '../data/odiiCategoryData';

interface OdiiAutoSliceRailProps {
  stories: OdiiStoryItem[];
  storySets?: Record<string, OdiiStoryItem[]>;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80',
];

function getFallbackImage(seed = ''): string {
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

function getValidImage(url?: string, seed?: string): string {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return getFallbackImage(seed);
  }
  return url;
}

function getUpcomingStories(stories: OdiiStoryItem[], activeIndex: number, count = 3): OdiiStoryItem[] {
  if (stories.length < 2) return [];
  return Array.from({ length: Math.min(count, stories.length - 1) }, (_, index) => stories[(activeIndex + index + 1) % stories.length]);
}

export const OdiiAutoSliceRail: React.FC<OdiiAutoSliceRailProps> = ({ stories, storySets }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [isSectionInView, setIsSectionInView] = useState(true);
  const previewTimerRef = useRef<number | null>(null);

  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const featured = useMemo(() => {
    const apiStories = storySets?.[activeTab];
    if (apiStories?.length) return apiStories.slice(0, 7);
    if (activeTab === '추천') return stories.slice(0, 7);

    const tab = ODII_HERO_TABS.find((item) => item.id === activeTab);
    const matched = stories.filter((story) =>
      [activeTab, tab?.keyword].filter(Boolean).some((keyword) =>
        story.category.includes(keyword as string) ||
        story.title.includes(keyword as string) ||
        story.locationName?.includes(keyword as string),
      ),
    );
    return (matched.length ? matched : stories).slice(0, 7);
  }, [activeTab, stories, storySets]);

  useEffect(() => {
    featured.slice(0, 7).forEach((story) => {
      const image = new window.Image();
      image.src = getValidImage(story.imageUrl, story.stid);
    });
  }, [featured]);

  const lead = featured[activeIndex] ?? featured[0];

  const advanceTo = useCallback((targetIndex: number, direction = 1) => {
    if (featured.length < 2) return;
    const nextIndex = (targetIndex + featured.length) % featured.length;
    setTransitionDirection(direction >= 0 ? 1 : -1);
    setPreviewIndex(nextIndex);

    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
    }

    // preview 큐가 한 칸 흐른 뒤 메인 장면이 따라오도록 짧은 리드 타임을 둔다.
    previewTimerRef.current = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      previewTimerRef.current = null;
    }, 150);
  }, [featured.length]);

  useEffect(() => () => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
    }
  }, []);

  // 7초 자동 이동
  useEffect(() => {
    if (featured.length < 2 || !isSectionInView) return;
    const timer = window.setInterval(() => {
      advanceTo((activeIndex + 1) % featured.length, 1);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [activeIndex, activeTab, advanceTo, featured.length, isSectionInView]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSectionInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (!lead) return null;

  const move = (nextDirection: number) => {
    // 전환 중에는 메인 카드보다 preview 큐가 먼저 이동하므로 큐의 위치를 기준으로 이어간다.
    advanceTo((previewIndex + nextDirection + featured.length) % featured.length, nextDirection);
  };

  const play = () => {
    if (currentStory.stid === lead.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(lead);
    }
  };

  const following = getUpcomingStories(featured, previewIndex, 3);

  const leadImageUrl = getValidImage(lead.imageUrl, lead.stid);

  return (
    <section ref={sectionRef} className="w-full pb-12 sm:pb-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        {/* 상단 필터 바 */}
        <div className="mb-3.5 flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ODII_HERO_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (previewTimerRef.current !== null) {
                    window.clearTimeout(previewTimerRef.current);
                    previewTimerRef.current = null;
                  }
                  setActiveTab(tab.id);
                  setActiveIndex(0);
                  setPreviewIndex(0);
                  setTransitionDirection(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-[#211e19] text-white shadow-sm font-bold'
                    : 'bg-[#f7f4ee] text-[#655b4d] hover:bg-[#ede5d8] hover:text-[#211e19]'
                }`}
              >
                {isTabActive && <span className="h-1.5 w-1.5 rounded-full bg-[#a94d35]" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 한 장면을 오래 듣고 다음 장면으로 이어지는 청음 스테이지 */}
        <div className="relative flex min-w-0 items-center gap-3 overflow-visible">
          
          {/* 메인 비주얼 배너 카드 (기존 메인은 왼쪽으로 퇴장, 오른쪽 서브가 왼쪽으로 당겨지며 메인 승격) */}
          <div className="relative min-h-[320px] min-w-0 flex-1 overflow-hidden rounded-[1.6rem] bg-[#6d6258] shadow-[0_18px_48px_rgba(43,35,26,0.16)] sm:min-h-[280px] md:h-[280px] md:min-h-0">
            
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={`${lead.stid}-${activeIndex}`}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full"
              >
                {/* 전환 때 무거운 blur를 다시 그리지 않고 낮은 대비의 장면으로 분위기만 연결 */}
                <img
                  src={leadImageUrl}
                  alt={lead.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImage(lead.stid);
                  }}
                  className="h-full w-full object-cover opacity-35 saturate-105"
                />
                <div className="absolute inset-0 bg-black/[0.035] backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/10" />
              </motion.div>
            </AnimatePresence>

            {/* 우측 상단 뱃지 */}
            <div className="absolute right-4 top-2.5 z-20">
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
                {activeIndex + 1} / {featured.length}
              </span>
            </div>

            {/* 메인 카드 정보 및 버튼 */}
            <div className="pointer-events-none relative z-10 grid min-h-[320px] grid-cols-1 items-center gap-5 p-5 sm:min-h-[280px] sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-7 sm:p-6 md:h-full md:min-h-0 lg:grid-cols-[minmax(0,1fr)_215px]">
              <div className="pointer-events-auto relative min-h-[176px] min-w-0 sm:min-h-[184px]">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`${lead.stid}-${activeIndex}`}
                    initial={{ opacity: 0, x: transitionDirection * 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: transitionDirection * -16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                  <span className="mb-3 inline-flex h-6 self-start items-center rounded-lg border border-white/20 bg-white/[0.12] px-2 text-[9px] font-semibold tracking-[0.04em] text-white/90 backdrop-blur-sm">
                    {lead.badgeText ?? lead.category}
                  </span>
                  <h2 className="max-w-xl font-odii-sans text-3xl sm:text-4xl font-bold text-white leading-[1.18] tracking-[-0.04em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]">
                    {lead.title}
                  </h2>
                  <p className="mt-3 max-w-md line-clamp-2 text-sm font-medium leading-6 text-white/90 sm:text-[15px]">
                    {lead.audioTitle}
                  </p>
                  <div className="mt-6 flex items-center gap-3 pointer-events-auto">
                    <button
                      type="button"
                      onClick={play}
                      className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#211e19] shadow-xl transition-colors hover:bg-white/90 active:bg-white/80"
                    >
                      <span>{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'}</span>
                      <span className="text-[11px] font-normal text-[#655b4d]">{lead.formattedDuration}</span>
                    </button>
                    <div
                      className="flex h-4 items-end gap-[2px] opacity-75"
                      aria-label={currentStory.stid === lead.stid && isPlaying ? '재생 중' : '재생 대기'}
                    >
                      {[0, 1, 2, 3, 4].map((bar) => {
                        const isLeadPlaying = currentStory.stid === lead.stid && isPlaying;
                        return (
                          <motion.span
                            key={bar}
                            animate={isLeadPlaying ? { height: ['4px', '13px', '6px', '10px', '4px'] } : { height: '4px' }}
                            transition={isLeadPlaying
                              ? { duration: 0.9 + bar * 0.08, repeat: Infinity, ease: 'easeInOut', delay: bar * 0.05 }
                              : { duration: 0.2 }}
                            className="w-[2px] rounded-full bg-white/80"
                          />
                        );
                      })}
                    </div>
                  </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 메인 장면은 같은 자리에 머물고, 다음 장면으로 조용히 교차 전환 */}
              <div className="pointer-events-none relative order-first mx-auto h-[198px] w-[75%] translate-x-2 rounded-[1rem] border border-white/20 bg-white/10 shadow-[0_14px_30px_rgba(0,0,0,0.07)] sm:order-none sm:h-[198px] sm:w-[75%] sm:translate-x-3 md:h-[202px] lg:h-[211px]">
                <div className="relative z-10 h-full w-full overflow-hidden rounded-[0.95rem] bg-white/10">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={`${lead.stid}-${activeIndex}`}
                      initial={{ opacity: 0, x: transitionDirection * 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: transitionDirection * -20 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <img
                        src={leadImageUrl}
                        alt=""
                        onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(lead.stid); }}
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* 제목 길이와 관계없이 항상 같은 자리에 놓이는 다음 탐색 버튼 */}
              <div className="pointer-events-auto absolute right-4 top-1/2 z-20 -translate-y-1/2">
                <button
                  type="button"
                  aria-label="다음 이야기"
                  onClick={() => move(1)}
                  className="flex h-10 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-[#211e19] shadow-lg transition-[background-color,transform] duration-300 hover:translate-x-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* 우측 다음 장면 preview: 작은 썸네일 큐 */}
          <div className="relative hidden h-[280px] w-[250px] shrink-0 translate-y-1.5 items-center md:flex">
            <span className="pointer-events-none absolute -left-3 top-1/2 h-px w-3 bg-gradient-to-r from-transparent to-[#a94d35]/40" aria-hidden="true" />
            <span className="pointer-events-none absolute -left-3 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-[#a94d35]/60" aria-hidden="true" />
            <div className="relative flex w-full flex-col gap-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {following.map((story, index) => {
                  const imgUrl = getValidImage(story.imageUrl, story.stid);
                  return (
                    <motion.button
                      key={`${story.stid}-${previewIndex}-${index}`}
                      layout
                      type="button"
                      aria-label={`${story.title} 이야기 선택`}
                      onClick={() => {
                        advanceTo((previewIndex + index + 1) % featured.length, 1);
                      }}
                      initial={{ opacity: 0, x: 24, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -28, y: 0, scale: 0.98 }}
                      transition={{
                        layout: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.25, ease: 'easeOut' },
                        x: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                        y: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                      }}
                      className="group relative h-[68px] w-full overflow-hidden rounded-lg border border-white/20 bg-[#211e19]/[0.1] text-left shadow-[0_8px_20px_rgba(43,35,26,0.12)] ring-1 ring-white/15 backdrop-blur-sm transition-[box-shadow,ring-color] duration-300 hover:border-white/35 hover:ring-white/45 hover:shadow-[0_12px_26px_rgba(43,35,26,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94d35]"
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackImage(story.stid);
                        }}
                        className="relative z-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#211e19]/80 via-[#211e19]/45 to-[#211e19]/15" />
                      <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 overflow-hidden bg-gradient-to-t from-white/[0.07] to-transparent">
                        <motion.div
                          animate={{ x: ['-6%', '6%', '-6%'], opacity: [0.1, 0.22, 0.1] }}
                          transition={{ duration: 4.2 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute -left-[8%] bottom-[-8px] h-5 w-[116%] rounded-[50%] bg-white/10 blur-[4px]"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-2 pt-5 text-white">
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold tracking-[0.04em] text-white/80">{story.locationName || story.category}</p>
                          <h4 className="mt-0.5 line-clamp-1 font-odii-sans text-xs font-bold leading-tight text-white">
                            {story.title}
                          </h4>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
