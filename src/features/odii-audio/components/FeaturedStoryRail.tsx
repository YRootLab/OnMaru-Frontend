'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface FeaturedStoryRailProps {
  stories: OdiiStoryItem[];
}

const TABS = ['추천', '한옥', '궁궐/역사', '전통시장', '고택'];
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

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(true);

  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const featured = useMemo(() => {
    if (activeTab === '추천') return stories.slice(0, 7);
    const matched = stories.filter((story) => story.category.includes(activeTab));
    return (matched.length ? matched : stories).slice(0, 7);
  }, [activeTab, stories]);

  const lead = featured[activeIndex] ?? featured[0];

  // 7초 자동 이동
  useEffect(() => {
    if (featured.length < 2 || !isSectionInView) return;
    const timer = window.setInterval(() => {
      setDirection(1);
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
    setDirection(nextDirection);
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
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 pb-12 sm:px-8 sm:pb-16">
      <div>
        {/* 상단 필터 바 */}
        <div className="mb-3.5 flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const isTabActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setDirection(1);
                  setActiveTab(tab);
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
                {tab}
              </button>
            );
          })}
        </div>

        {/* 같은 장면을 확장·블러 처리한 배경 위에 원본 앨범아트를 올린 에디토리얼 히어로 */}
        <div className="relative flex items-center gap-3 overflow-hidden">
          
          {/* 메인 비주얼 배너 카드 (기존 메인은 왼쪽으로 퇴장, 오른쪽 서브가 왼쪽으로 당겨지며 메인 승격) */}
          <div className="relative flex-1 min-h-[420px] sm:min-h-[390px] h-auto rounded-[1.75rem] overflow-hidden bg-[#6d6258] shadow-[0_20px_55px_rgba(43,35,26,0.18)]">
            
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
            <div className="absolute top-4 right-4 z-20">
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
                {activeIndex + 1} / {featured.length}
              </span>
            </div>

            {/* 메인 카드 정보 및 버튼 */}
            <div className="relative z-10 grid min-h-[420px] grid-cols-1 items-center gap-6 p-6 sm:min-h-[390px] sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-8 sm:p-9 lg:grid-cols-[minmax(0,1fr)_220px] pointer-events-none">
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
                  <h2 className="max-w-xl font-maruburi text-3xl sm:text-4xl font-bold text-white leading-[1.18] tracking-[-0.04em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]">
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${lead.stid}-art`}
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.04, y: -8 }}
                  transition={springTransition}
                  className="pointer-events-none order-first mx-auto w-[156px] overflow-hidden rounded-[1.2rem] border border-white/30 bg-white/10 shadow-[0_18px_36px_rgba(0,0,0,0.07)] sm:order-none sm:mb-14 sm:w-full"
                >
                  <img
                    src={leadImageUrl}
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(lead.stid); }}
                    className="aspect-[3/4] h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* 제목 길이와 관계없이 항상 같은 자리에 놓이는 다음 탐색 버튼 */}
              <div className="pointer-events-auto absolute bottom-6 left-6 z-20 sm:bottom-9 sm:left-auto sm:right-9">
                <button
                  type="button"
                  aria-label="다음 이야기"
                  onClick={() => move(1)}
                  className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#211e19] shadow-lg transition-colors duration-500 hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  다음 이야기 <span aria-hidden="true" className="text-base leading-none">›</span>
                </button>
              </div>
            </div>
          </div>

          {/* 우측 4개 세로 대기 카드 (한 칸씩 자연스럽게 왼쪽으로 전진 이동하는 Layout Shift) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {following.map((story, index) => {
                const imgUrl = getValidImage(story.imageUrl, story.stid);
                return (
                  <motion.div
                    key={story.stid}
                    layout
                    onClick={() => {
                      setDirection(1);
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

                    className="relative h-[315px] w-[78px] sm:w-[84px] rounded-[1.3rem] overflow-hidden cursor-pointer group shadow-md ring-1 ring-black/10 transition-colors hover:ring-white/60"
                  >
                    <img
                      src={imgUrl}
                      alt={story.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackImage(story.stid);
                      }}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 inset-x-0 p-2 text-white">
                      <h4 className="font-maruburi text-[10px] font-bold line-clamp-2 leading-snug">
                        {story.title}
                      </h4>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};
