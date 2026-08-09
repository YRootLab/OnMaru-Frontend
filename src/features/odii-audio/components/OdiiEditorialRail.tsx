'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { IOdiiApiService, OdiiStoryItem } from '../types/odii.types';
import { ODII_THEME_CATEGORIES } from '../data/odiiCategoryData';
import { useOdiiApiService } from '../context/OdiiDependencyContext';

interface OdiiEditorialRailProps {
  stories: OdiiStoryItem[];
  storySets?: Record<string, OdiiStoryItem[]>;
  apiService?: IOdiiApiService;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=900&q=80',
];

const imageFor = (story: OdiiStoryItem, index: number) => story.imageUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
const durationFor = (story: OdiiStoryItem) => story.formattedDuration || `${Math.floor((Number(story.playTime) || 0) / 60)}:${String((Number(story.playTime) || 0) % 60).padStart(2, '0')}`;

export const OdiiEditorialRail: React.FC<OdiiEditorialRailProps> = ({ stories, storySets, apiService }) => {
  const activeApiService = useOdiiApiService(apiService);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const [selectedKeyword, setSelectedKeyword] = useState(ODII_THEME_CATEGORIES[0].keyword);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryStories, setCategoryStories] = useState<OdiiStoryItem[] | null>(null);
  const categoryRequestRef = useRef(0);
  const [activePosition, setActivePosition] = useState(60);
  const [trackTransitionEnabled, setTrackTransitionEnabled] = useState(true);
  const [autoResetToken, setAutoResetToken] = useState(0);
  const resetTimerRef = useRef<number | null>(null);
  const [trackMetrics, setTrackMetrics] = useState({ cardWidth: 225, cardStep: 245 });
  const featured = useMemo(() => {
    const category = ODII_THEME_CATEGORIES.find((item) => item.keyword === selectedKeyword) ?? ODII_THEME_CATEGORIES[0];
    const localCategoryStories = storySets?.[category.label] ?? stories.filter((story) => {
      const searchable = `${story.category} ${story.title} ${story.locationName}`.toLowerCase();
      return searchable.includes(category.keyword.toLowerCase());
    });
    const recommendationStories = storySets?.['추천'];
    const source = categoryStories?.length ? categoryStories : localCategoryStories.length ? localCategoryStories : (recommendationStories?.length ? recommendationStories : stories);
    return source.slice(0, 10);
  }, [categoryStories, selectedKeyword, stories, storySets]);
  const activeIndex = featured.length ? ((activePosition % featured.length) + featured.length) % featured.length : 0;
  const activeStory = featured[activeIndex] ?? featured[0];
  const trackStories = useMemo(() => Array.from({ length: 120 }, (_, index) => ({ story: featured[index % Math.max(featured.length, 1)], position: index })), [featured]);

  useEffect(() => {
    const updateTrackMetrics = () => {
      if (window.innerWidth < 640) {
        setTrackMetrics({ cardWidth: 135, cardStep: 150 });
      } else if (window.innerWidth < 1024) {
        setTrackMetrics({ cardWidth: 200, cardStep: 220 });
      } else {
        setTrackMetrics({ cardWidth: 225, cardStep: 245 });
      }
    };
    updateTrackMetrics();
    window.addEventListener('resize', updateTrackMetrics);
    return () => window.removeEventListener('resize', updateTrackMetrics);
  }, []);

  useEffect(() => {
    setActivePosition(60);
    setTrackTransitionEnabled(true);
  }, [selectedKeyword]);

  const moveBy = useCallback((delta: number, resetAuto = true) => {
    if (!delta) return;
    if (resetAuto) setAutoResetToken((token) => token + 1);
    setActivePosition((position) => position + delta);
  }, []);

  const moveTo = useCallback((index: number) => {
    let delta = index - activeIndex;
    if (delta > featured.length / 2) delta -= featured.length;
    if (delta < -featured.length / 2) delta += featured.length;
    moveBy(delta);
  }, [activeIndex, featured.length, moveBy]);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => moveBy(1, false), 7000);
    return () => window.clearInterval(timer);
  }, [autoResetToken, featured.length, moveBy]);

  useEffect(() => () => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleTrackTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || featured.length < 2) return;
    if (activePosition <= 90 && activePosition >= 30) return;

    setTrackTransitionEnabled(false);
    setActivePosition((position) => position > 90 ? position - featured.length : position + featured.length);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTrackTransitionEnabled(true));
    });
  }, [activePosition, featured.length]);

  const handleCategoryChange = (keyword: string) => {
    if (keyword === selectedKeyword) return;
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    setIsCategoryLoading(true);
    setTrackTransitionEnabled(false);
    setActivePosition(60);
    setSelectedKeyword(keyword);
    const requestId = categoryRequestRef.current + 1;
    categoryRequestRef.current = requestId;
    activeApiService.getStoryList(undefined, keyword)
      .then((nextStories) => {
        if (requestId !== categoryRequestRef.current) return;
        setCategoryStories(nextStories.filter((story) => story.audioUrl));
      })
      .catch(() => {
        if (requestId !== categoryRequestRef.current) return;
        setCategoryStories([]);
      })
      .finally(() => {
        if (requestId !== categoryRequestRef.current) return;
        resetTimerRef.current = window.setTimeout(() => {
          setIsCategoryLoading(false);
          setTrackTransitionEnabled(true);
        }, 260);
      });
  };

  if (!activeStory) return null;

  return (
    <section aria-label="오디 셀렉션" className="relative left-1/2 w-screen -translate-x-1/2 py-3 sm:py-5">
      <div className="w-full px-0">
        <div className="relative px-1 pb-2 pt-1 sm:px-3 sm:pt-2">
          <div className="mx-auto mb-3 w-full max-w-6xl px-4 sm:px-8">
            <nav aria-label="장면 카테고리" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-4">
                {ODII_THEME_CATEGORIES.map((category) => {
                  const isSelected = selectedKeyword === category.keyword;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.keyword)}
                      aria-pressed={isSelected}
                      className={`select-none whitespace-nowrap text-xs transition-colors duration-300 sm:text-sm ${isSelected ? 'font-semibold text-[#f84e76]' : 'text-[#8c7e6c] hover:text-[#211e19]'}`}
                    >
                      #{category.keyword === '시장' ? '전통시장' : category.keyword === '궁' ? '궁궐' : category.keyword === '길' ? '자연' : category.keyword}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          <div className="relative mt-0 h-[355px] overflow-hidden sm:h-[430px] lg:h-[465px]">
            {isCategoryLoading && (
              <div className="absolute inset-x-0 top-3 flex items-start justify-center gap-4 px-4 sm:gap-5 lg:gap-5">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <div
                    key={index}
                    className={`h-[250px] w-[135px] shrink-0 animate-pulse overflow-hidden border border-[#211e19]/8 bg-white/70 shadow-[0_18px_35px_rgba(33,30,25,0.10)] sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${index % 2 ? 'translate-y-2 rotate-[1.2deg]' : '-translate-y-1 rotate-[-1.2deg]'}`}
                  >
                    <div className="h-[62%] bg-gradient-to-br from-[#f4e8eb] via-[#eee7e3] to-[#e5dfe0]" />
                    <div className="space-y-3 bg-white/70 px-4 py-5 sm:px-5 sm:py-6">
                      <div className="h-2.5 w-16 rounded bg-[#f8b3c4]/55" />
                      <div className="h-4 w-4/5 rounded bg-[#d8d1cc]/70" />
                      <div className="h-3 w-3/5 rounded bg-[#e3dcd7]/75" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isCategoryLoading && <div
              className="absolute left-1/2 top-3 flex items-start gap-4 sm:gap-5 lg:gap-5"
              style={{
                transform: `translate3d(${-(trackMetrics.cardStep * activePosition + trackMetrics.cardWidth / 2)}px, 0, 0)`,
                transition: trackTransitionEnabled ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {trackStories.map(({ story, position }) => {
                const offset = position - activePosition;
                const distance = Math.abs(offset);
                const isActive = offset === 0;
                const tilt = isActive ? 0 : offset < 0
                  ? (Math.abs(offset) % 2 === 1 ? 1.6 : -1.6)
                  : (offset % 2 === 1 ? -1.6 : 1.6);
                const lift = isActive ? 0 : offset < 0
                  ? (Math.abs(offset) % 2 === 1 ? -6 : 6)
                  : (offset % 2 === 1 ? 6 : -6);
                return (
                  <motion.button
                    key={position}
                    type="button"
                    animate={{
                      opacity: distance <= 4 ? (isActive ? 1 : 0.54) : 0,
                      y: lift,
                      rotate: tilt,
                      scale: isActive ? 1 : distance === 1 ? 0.92 : 0.84,
                    }}
                    transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      moveBy(offset);
                      if (isActive) setCurrentStory(story);
                    }}
                    className={`relative h-[250px] w-[135px] shrink-0 overflow-hidden border bg-white text-left sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${isActive ? 'z-20 border-[#f84e76] shadow-[0_22px_48px_rgba(33,30,25,0.18),0_8px_24px_rgba(248,78,118,0.13)]' : 'z-10 border-[#211e19]/12 shadow-[0_18px_35px_rgba(33,30,25,0.16)] grayscale-[0.15] hover:grayscale-0'}`}
                    aria-label={`${story.title}${isActive ? ' 현재 선택됨' : ''}`}
                  >
                    <img src={imageFor(story, position)} alt="" loading={distance <= 3 ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-black/5" />
                    <span className="pointer-events-none absolute left-4 top-4 z-10 text-[10px] font-semibold tabular-nums text-white mix-blend-difference drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                      {String((position % featured.length) + 1).padStart(2, '0')}
                    </span>
                    <div className={`absolute inset-x-0 bottom-0 px-4 py-4 text-[#211e19] backdrop-blur-[24px] sm:px-5 sm:py-5 ${isActive ? 'bg-[#fff0f5]/[0.68] shadow-[0_-8px_20px_rgba(248,78,118,0.08)]' : 'bg-white/[0.46] shadow-[0_-8px_20px_rgba(255,255,255,0.12)]'}`}>
                      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-[#F84E76]">{story.category}</p>
                      <h3 className="mt-1 line-clamp-2 font-odii-sans text-base font-semibold leading-tight tracking-[-0.03em] sm:text-lg">{story.title}</h3>
                      <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-[#786d5e]">{story.locationName || '대한민국 문화유산'}</p>
                      {isActive && <span className="mt-2 inline-flex items-center gap-2 text-[10px] text-[#f84e76]">{durationFor(story)} <span className="text-[#8c7e6c]">↗</span></span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>}
          </div>

          <div className="relative z-30 flex items-center justify-center gap-5">
            <button type="button" onClick={() => moveBy(-1)} onDragStart={(event) => event.preventDefault()} draggable={false} className="select-none text-sm text-[#786d5e] transition-colors hover:text-[#211e19]" aria-label="이전 이야기">←</button>
            <div className="flex items-center gap-1.5">
              {featured.map((story, index) => (
                <button key={story.stid} type="button" onClick={() => moveTo(index)} className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-[#f84e76]' : 'w-1.5 bg-[#211e19]/20 hover:bg-[#211e19]/50'}`} aria-label={`${index + 1}번째 이야기 선택`} />
              ))}
            </div>
            <button type="button" onClick={() => moveBy(1)} onDragStart={(event) => event.preventDefault()} draggable={false} className="select-none text-sm text-[#786d5e] transition-colors hover:text-[#211e19]" aria-label="다음 이야기">→</button>
          </div>
        </div>
      </div>
    </section>
  );
};
