'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
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

export const OdiiAutoSliceRail: React.FC<OdiiAutoSliceRailProps> = ({ stories, storySets }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(true);

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

  const lead = featured[activeIndex] ?? featured[0];

  // 7초 자동 이동
  useEffect(() => {
    if (featured.length < 2 || !isSectionInView) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % featured.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featured.length, activeTab, autoplayVersion, isSectionInView]);

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
    setActiveIndex((index) => (index + nextDirection + featured.length) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };

  const play = () => {
    if (currentStory.stid === lead.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(lead);
    }
  };

  // 우측 3개 대기 서브 카드
  const following = featured
    .slice(1, 4)
    .map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  const leadImageUrl = getValidImage(lead.imageUrl, lead.stid);

  // 세련되고 반응성이 빠른 트랜지션 베지어 커브 (0.3초 속도 개선)
  const springTransition = {
    duration: 0.35,
    ease: [0.16, 1, 0.3, 1] as const,
  };


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
                  setActiveTab(tab.id);
                  setActiveIndex(0);
                  setAutoplayVersion((version) => version + 1);
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

        {/* 같은 장면을 확장·블러 처리한 배경 위에 원본 앨범아트를 올린 에디토리얼 히어로 */}
        <LayoutGroup id="odii-hero-scenes">
        <div className="relative flex min-w-0 items-center gap-3 overflow-visible">
          
          {/* 메인 비주얼 배너 카드 (기존 메인은 왼쪽으로 퇴장, 오른쪽 서브가 왼쪽으로 당겨지며 메인 승격) */}
          <div className="relative min-h-[300px] min-w-0 flex-1 overflow-hidden rounded-[1.6rem] bg-[#6d6258] shadow-[0_18px_48px_rgba(43,35,26,0.16)] sm:min-h-[260px] md:h-[260px] md:min-h-0">
            
            <AnimatePresence mode="sync">
              <motion.div
                key={lead.stid}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 h-full w-full"
              >
                {/* 이미지를 크게 확장해 주변 색감만 남기는 Apple Store식 배경 */}
                <img
                  src={leadImageUrl}
                  alt={lead.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImage(lead.stid);
                  }}
                  className="h-full w-full scale-125 object-cover opacity-100 blur-2xl saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-black/5" />
              </motion.div>
            </AnimatePresence>

            {/* 우측 상단 뱃지 */}
            <div className="absolute right-4 top-2.5 z-20">
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
                {activeIndex + 1} / {featured.length}
              </span>
            </div>

            {/* 메인 카드 정보 및 버튼 */}
            <div className="pointer-events-none relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-5 p-5 sm:min-h-[260px] sm:grid-cols-[minmax(0,1fr)_180px] sm:gap-7 sm:p-6 md:h-full md:min-h-0 lg:grid-cols-[minmax(0,1fr)_205px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={lead.stid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="pointer-events-auto"
                >
                  <span className="inline-block px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold tracking-wide backdrop-blur-md border border-white/15 shadow-sm mb-3">
                    {lead.badgeText ?? lead.category}
                  </span>
                  <h2 className="max-w-xl font-odii-sans text-3xl sm:text-4xl font-bold text-white leading-[1.18] tracking-[-0.04em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]">
                    {lead.title}
                  </h2>
                  <p className="mt-3 max-w-md text-xs sm:text-sm text-white/80 font-light line-clamp-2 leading-6">
                    {lead.audioTitle}
                  </p>
                  <div className="mt-6 pointer-events-auto">
                    <button
                      type="button"
                      onClick={play}
                      className="px-5 py-2.5 rounded-full bg-white text-[#211e19] text-xs font-bold shadow-xl transition-colors hover:bg-white/90 active:bg-white/80 flex items-center gap-1.5"
                    >
                      <span>{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'}</span>
                      <span className="text-[11px] text-[#655b4d] font-normal">{lead.formattedDuration}</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 블러 배경과 대비되는 원본 앨범아트 */}
              <motion.div
                layoutId={`odii-story-art-${lead.stid}`}
                transition={springTransition}
                className="pointer-events-none order-first mx-auto w-[156px] overflow-hidden rounded-[1rem] border border-white/30 bg-white/10 shadow-[0_14px_30px_rgba(0,0,0,0.07)] sm:order-none sm:h-[180px] sm:w-full md:h-[190px] lg:h-[200px]"
              >
                <img
                  src={leadImageUrl}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(lead.stid); }}
                  className="h-full w-full object-cover"
                />
              </motion.div>

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

          {/* 우측 3개 세로 대기 카드 (한 칸씩 자연스럽게 왼쪽으로 전진 이동하는 Layout Shift) */}
          <div className="hidden h-[260px] shrink-0 items-center gap-2 md:flex">
            <AnimatePresence mode="sync" initial={false}>
              {following.map((story, index) => {
                const imgUrl = getValidImage(story.imageUrl, story.stid);
                return (
                  <motion.div
                    key={story.stid}
                    layout
                    onClick={() => {
                      setActiveIndex((activeIndex + index + 1) % featured.length);
                      setAutoplayVersion((v) => v + 1);
                    }}
                    initial={{ opacity: 0, x: 40, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.9 }}
                    transition={{
                      layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
                      opacity: { duration: 0.25 },
                      x: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
                    }}

                    className="group relative h-full w-[78px] cursor-pointer overflow-hidden rounded-[1rem] shadow-md ring-1 ring-black/10 transition-[box-shadow,ring-color] hover:ring-white/60 sm:w-[84px]"
                  >
                    <motion.div
                      layoutId={`odii-story-art-${story.stid}`}
                      transition={springTransition}
                      className="absolute inset-0"
                    >
                      <img
                        src={imgUrl}
                        alt={story.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackImage(story.stid);
                        }}
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 inset-x-0 p-2 text-white">
                      <h4 className="font-odii-sans text-[10px] font-bold line-clamp-2 leading-snug">
                        {story.title}
                      </h4>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
        </LayoutGroup>
      </div>
    </section>
  );
};
