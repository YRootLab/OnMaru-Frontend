'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { ODII_HERO_TABS, ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';

interface FeaturedStoryRailProps {
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

const BOARD_LAYOUTS = [
  'col-span-2 min-h-[360px] md:col-span-7 md:row-span-6 md:min-h-0',
  'col-span-1 min-h-[220px] md:col-span-5 md:row-span-3 md:min-h-0',
  'col-span-1 min-h-[220px] md:col-span-5 md:row-span-3 md:min-h-0',
  'col-span-1 min-h-[230px] md:col-span-4 md:row-span-4 md:min-h-0',
  'col-span-1 min-h-[230px] md:col-span-3 md:row-span-4 md:min-h-0',
  'col-span-1 min-h-[230px] md:col-span-5 md:row-span-4 md:min-h-0',
  'col-span-2 min-h-[250px] md:col-span-7 md:row-span-4 md:min-h-0',
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

function formatCategory(story: OdiiStoryItem): string {
  return story.category || story.locationName || '한국의 문화 이야기';
}

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories, storySets }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const activeMeta = ODII_THEME_CATEGORIES.find((category) => category.id === activeTab);
  const activeTabMeta = ODII_HERO_TABS.find((tab) => tab.id === activeTab);

  const featured = useMemo(() => {
    const apiStories = storySets?.[activeTab];
    if (apiStories?.length) return apiStories.slice(0, 7);
    if (activeTab === '추천') return stories.slice(0, 7);

    const keywords = [activeTab, activeTabMeta?.keyword].filter(Boolean) as string[];
    const matched = stories.filter((story) =>
      keywords.some((keyword) =>
        story.category.includes(keyword) ||
        story.title.includes(keyword) ||
        story.audioTitle.includes(keyword) ||
        story.locationName?.includes(keyword),
      ),
    );

    return (matched.length ? matched : stories).slice(0, 7);
  }, [activeTab, activeTabMeta?.keyword, stories, storySets]);

  const normalizedIndex = featured.length > 0 ? activeIndex % featured.length : 0;
  const boardStories = useMemo(
    () => featured.map((_, index) => featured[(normalizedIndex + index) % featured.length]),
    [featured, normalizedIndex],
  );
  const lead = boardStories[0];

  useEffect(() => {
    if (featured.length < 2 || !isSectionInView || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((index) => (index + 1) % featured.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featured.length, autoplayVersion, isSectionInView, shouldReduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSectionInView(entry.isIntersecting),
      { threshold: 0.15 },
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

  const selectStory = (index: number) => {
    setDirection(index === 0 ? 1 : -1);
    setActiveIndex((normalizedIndex + index) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };

  const play = () => {
    if (currentStory.stid === lead.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(lead);
    }
  };

  return (
    <section ref={sectionRef} className="w-full pb-12 sm:pb-16">
      <div>
        <div role="tablist" aria-label="오디 핵심 카테고리" className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ODII_HERO_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabClass = [
              'whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-300',
              isActive ? 'bg-[#211e19] text-white' : 'bg-[#f7f4ee] text-[#655b4d] hover:bg-[#ede5d8] hover:text-[#211e19]',
            ].join(' ');

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveIndex(0);
                  setAutoplayVersion((version) => version + 1);
                }}
                className={tabClass}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid auto-rows-[72px] grid-cols-2 gap-2.5 md:auto-rows-[68px] md:grid-cols-12">
          {boardStories.map((story, index) => {
            const imageUrl = getValidImage(story.imageUrl, story.stid);
            const isLead = index === 0;
            const isPlayingStory = currentStory.stid === story.stid && isPlaying;
            const cardClass = [
              'group relative overflow-hidden rounded-2xl border border-[#211e19]/10 bg-[#fbf8f2] outline-none ring-offset-2 transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-[#a94d35]/70',
              BOARD_LAYOUTS[index] || 'col-span-2 min-h-[240px] md:col-span-4 md:row-span-3',
              isLead ? ' ring-2 ring-[#a94d35]/60' : ' hover:',
            ].join(' ');
            const imageClass = [
              'absolute object-cover transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.02]',
              isLead
                ? 'inset-y-0 right-0 h-full w-[47%] opacity-[0.65] grayscale-[0.2] saturate-[0.65] sm:w-[43%]'
                : 'inset-x-0 top-0 h-[40%] w-full opacity-[0.7] grayscale-[0.15] saturate-[0.7]',
            ].join(' ');
            const contentClass = [
              'z-10 text-[#211e19]',
              isLead
                ? 'absolute inset-y-0 left-0 flex w-[70%] flex-col justify-end bg-[#fbf8f2]/96 p-5 sm:w-[63%] sm:p-6'
                : 'absolute inset-x-0 bottom-0 top-[40%] border-t border-[#211e19]/10 bg-[#fbf8f2] p-3.5 sm:p-4',
            ].join(' ');

            return (
              <motion.article
                key={`${story.stid}-${index}`}
                layout
                tabIndex={0}
                aria-current={isLead ? 'true' : undefined}
                onClick={() => selectStory(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectStory(index);
                  }
                }}
                initial={shouldReduceMotion ? undefined : { opacity: 0, x: direction * 14 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
                className={cardClass}
              >
                <img
                  src={imageUrl}
                  alt={story.title}
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getFallbackImage(story.stid);
                  }}
                  className={imageClass}
                />
                {isLead && <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%] bg-gradient-to-r from-[#fbf8f2] via-[#fbf8f2]/10 to-transparent" />}

                <div className={contentClass}>
                  <p className={isLead ? 'truncate text-xs font-semibold text-[#8c7e6c]' : 'truncate text-[10px] font-semibold text-[#8c7e6c]'}>
                    {story.locationName || formatCategory(story)}
                  </p>
                  <h3 className={isLead ? 'mt-1 font-odii-sans text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl' : 'mt-1 font-odii-sans text-sm font-bold leading-tight tracking-[-0.035em] sm:text-base'}>
                    {story.title}
                  </h3>

                  {isLead ? (
                    <>
                      <p className="mt-2 max-w-lg text-xs leading-5 text-[#655b4d] sm:text-sm">{story.audioTitle}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            play();
                          }}
                          aria-label={story.title + ' ' + (isPlayingStory ? '일시정지' : '듣기')}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#211e19] px-4 text-xs font-bold text-[#fffaf3]  transition-colors hover:bg-[#a94d35]"
                        >
                          <span aria-hidden="true">{isPlayingStory ? 'Ⅱ' : '▶'}</span>
                          {isPlayingStory ? '일시정지' : '이야기 듣기'}
                          {story.formattedDuration && <span className="font-normal text-[#d8d0c5]">{story.formattedDuration}</span>}
                        </button>
                        <span className="text-[10px] text-[#8c7e6c]">{activeMeta?.label || '오늘의 추천'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#786d5e]">
                      <span className="truncate">{activeMeta?.label || formatCategory(story)}</span>
                      <span className="shrink-0">{story.formattedDuration || '오디오'}</span>
                    </div>
                  )}
                </div>

                {!isLead && isPlayingStory && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#a94d35] px-2 py-1 text-[9px] font-bold text-white ">
                    재생 중
                  </span>
                )}
              </motion.article>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#211e19]/10 pt-3">
          <span className="text-[11px] text-[#8c7e6c]">
            {String(normalizedIndex + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
            <span className="ml-2">카드를 고르면 앞으로 이동합니다</span>
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            className="text-xs font-semibold text-[#211e19] underline decoration-[#a94d35]/50 underline-offset-4 transition-colors hover:text-[#a94d35]"
          >
            다음 이야기 →
          </button>
        </div>
      </div>
    </section>
  );
};
