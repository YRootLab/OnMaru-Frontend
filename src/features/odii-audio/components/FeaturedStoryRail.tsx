'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface FeaturedStoryRailProps {
  stories: OdiiStoryItem[];
}

const TABS = ['추천', '한옥', '궁궐/역사', '전통시장', '고택'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80';

function getValidImage(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return FALLBACK_IMAGE;
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
    if (activeTab === '추천') return stories.slice(0, 10);
    const matched = stories.filter((story) => story.category.includes(activeTab));
    return (matched.length ? matched : stories).slice(0, 10);
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

  // 우측 4개 대기 서브 카드
  const following = featured
    .slice(1, 5)
    .map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  const leadImageUrl = getValidImage(lead.imageUrl);

  // 자연스러운 슬라이드 트랜지션 베지어 커브 (Apple / Netflix Style Curve)
  const springTransition = {
    duration: 0.65,
    ease: [0.16, 1, 0.3, 1] as const,
  };


  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 pb-12 sm:px-8 sm:pb-16">
      <div>
        {/* 상단 필터 바 */}
        <div className="mb-4 flex items-center space-x-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setDirection(1);
                setActiveTab(tab);
                setActiveIndex(0);
                setAutoplayVersion((version) => version + 1);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                activeTab === tab
                  ? 'bg-[#e54527] text-white scale-105'
                  : 'bg-[#f7f0e4]/80 text-[#554c41] hover:bg-[#e8dfd1] hover:text-[#211e19]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 메인 슬라이더 레이아웃 (자연스러운 좌측 흐름 시프팅) */}
        <div className="relative flex items-center gap-3 overflow-hidden">
          
          {/* 메인 비주얼 배너 카드 (기존 메인은 왼쪽으로 퇴장, 오른쪽 서브가 왼쪽으로 당겨지며 메인 승격) */}
          <div className="relative flex-1 min-h-[295px] sm:min-h-[315px] h-[315px] rounded-[1.6rem] overflow-hidden shadow-xl group">
            
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={lead.stid}
                custom={direction}
                initial={{
                  x: direction > 0 ? '100%' : '-100%',
                  opacity: 0.8,
                }}
                animate={{
                  x: '0%',
                  opacity: 1,
                }}
                exit={{
                  x: direction > 0 ? '-100%' : '100%',
                  opacity: 0.2,
                }}
                transition={springTransition}
                className="absolute inset-0 h-full w-full"
              >
                {/* 배경 비주얼 이미지 */}
                <img
                  src={leadImageUrl}
                  alt={lead.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* 하단/좌측 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>

            {/* 우측 상단 뱃지 */}
            <div className="absolute top-4 right-4 z-20">
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
                {activeIndex + 1} / {featured.length}
              </span>
            </div>

            {/* 메인 카드 정보 및 버튼 */}
            <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-7 min-h-[295px] sm:min-h-[315px] pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={lead.stid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="pointer-events-auto"
                >
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#e54527] text-white text-[10px] font-bold tracking-wide uppercase shadow-md mb-2">
                    {lead.category} · {lead.locationName}
                  </span>
                  <h2 className="font-maruburi text-2xl sm:text-4xl font-bold text-white leading-[1.18] tracking-[-0.04em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)]">
                    {lead.title}
                  </h2>
                  <p className="mt-2 max-w-md text-xs sm:text-sm text-white/90 font-light line-clamp-1 drop-shadow">
                    {lead.audioTitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* 재생/탐색 버튼 컨트롤 */}
              <div className="mt-5 flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={play}
                  className="px-5 py-2.5 rounded-full bg-white text-[#211e19] text-xs font-bold shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <span>{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'}</span>
                  <span className="text-[11px] text-[#655b4d] font-normal">{lead.formattedDuration}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="이전"
                    onClick={() => move(-1)}
                    className="w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-transform active:scale-95 text-xs"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="다음"
                    onClick={() => move(1)}
                    className="w-8 h-8 rounded-full bg-white text-[#211e19] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 text-xs font-bold"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 4개 세로 대기 카드 (한 칸씩 자연스럽게 왼쪽으로 전진 이동하는 Layout Shift) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {following.map((story, index) => {
                const imgUrl = getValidImage(story.imageUrl);
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
                      layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
                      opacity: { duration: 0.3 },
                      x: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
                    }}

                    className="relative h-[315px] w-[78px] sm:w-[84px] rounded-[1.3rem] overflow-hidden cursor-pointer group shadow-md ring-1 ring-black/10 transition-all hover:w-[98px]"
                  >
                    <img
                      src={imgUrl}
                      alt={story.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 inset-x-0 p-2 text-white">
                      <span className="text-[8px] font-bold text-amber-300 uppercase block">
                        {story.category}
                      </span>
                      <h4 className="font-maruburi text-[10px] font-bold line-clamp-2 mt-0.5 leading-snug">
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
