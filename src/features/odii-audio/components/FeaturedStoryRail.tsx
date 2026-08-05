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
  const visualDirection = direction;

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

  // 요청사항: 4개의 대기 세로 서브 카드
  const following = featured
    .slice(1, 5)
    .map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  const leadImageUrl = getValidImage(lead.imageUrl);

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
      <div>
        {/* 상단 탭 필터 바 */}
        <div className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                activeTab === tab
                  ? 'bg-[#e54527] text-white scale-105'
                  : 'bg-[#f7f0e4]/80 text-[#554c41] hover:bg-[#e8dfd1] hover:text-[#211e19]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 3D Flip 컨테이너 */}
        <div className="relative flex items-center gap-3 overflow-hidden [perspective:1200px]">
          
          {/* 메인 풀블리드 비주얼 카드 (3D Flip 적용 영역) */}
          <div className="relative flex-1 min-h-[380px] sm:min-h-[420px] rounded-[2rem] overflow-hidden shadow-xl group [transform-style:preserve-3d]">
            
            {/* 🌟 3D Flip (좌->우 회전 뒤집기) 애니메이션 레이어 */}
            <AnimatePresence initial={false} mode="sync">
              <motion.img
                key={lead.stid}
                src={leadImageUrl}
                alt={lead.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                initial={{
                  opacity: 0,
                  rotateY: visualDirection > 0 ? -60 : 60,
                  scale: 1.12,
                  x: visualDirection * 40,
                }}
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  rotateY: visualDirection > 0 ? 60 : -60,
                  scale: 0.92,
                  x: visualDirection * -40,
                }}
                transition={{ duration: 0.75, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 origin-center"
              />
            </AnimatePresence>

            {/* 시네마틱 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* 우측 상단 뱃지 */}
            <div className="absolute top-5 right-5 z-20">
              <span className="px-3 py-1 rounded-full bg-black/50 text-white text-[11px] font-semibold backdrop-blur-md border border-white/20">
                {activeIndex + 1} / {featured.length}
              </span>
            </div>

            {/* 메인 카드 정보 & 컨트롤 */}
            <div className="relative z-10 flex flex-col justify-end h-full p-8 sm:p-10 min-h-[380px] sm:min-h-[420px]">
              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-[#e54527] text-white text-[11px] font-bold tracking-wide uppercase shadow-md mb-3">
                  {lead.category} · {lead.locationName}
                </span>
                <h2 className="font-maruburi text-3xl sm:text-5xl font-bold text-white leading-[1.18] tracking-[-0.04em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                  {lead.title}
                </h2>
                <p className="mt-3 max-w-lg text-sm sm:text-base text-white/90 font-light line-clamp-2 drop-shadow">
                  {lead.audioTitle}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={play}
                  className="px-6 py-3 rounded-full bg-white text-[#211e19] text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'}</span>
                  <span className="text-xs text-[#655b4d] font-normal">{lead.formattedDuration}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="이전"
                    onClick={() => move(-1)}
                    className="w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-transform active:scale-95"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="다음"
                    onClick={() => move(1)}
                    className="w-10 h-10 rounded-full bg-white text-[#211e19] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 font-bold"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 4개 콤팩트 대기 카드 트랙 (요청 반영: 콤팩트한 4개 세로 카드) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <AnimatePresence initial={false} mode="popLayout">
              {following.map((story, index) => {
                const imgUrl = getValidImage(story.imageUrl);
                return (
                  <motion.div
                    key={`${lead.stid}-${story.stid}`}
                    onClick={() => {
                      setDirection(1);
                      setActiveIndex((activeIndex + index + 1) % featured.length);
                      setAutoplayVersion((v) => v + 1);
                    }}
                    initial={{ opacity: 0, x: 20, rotateY: -30, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, rotateY: 30, scale: 0.95 }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="relative h-[380px] sm:h-[420px] w-[88px] sm:w-[96px] rounded-[1.6rem] overflow-hidden cursor-pointer group shadow-md ring-1 ring-black/10 transition-all hover:w-[110px]"
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
                    
                    <div className="absolute bottom-0 inset-x-0 p-2.5 text-white">
                      <span className="text-[9px] font-bold text-amber-300 uppercase block">
                        {story.category}
                      </span>
                      <h4 className="font-maruburi text-[11px] font-bold line-clamp-2 mt-0.5 leading-snug">
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
