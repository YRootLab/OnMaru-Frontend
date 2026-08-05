'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
}

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories }) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const handleCardClick = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const getScriptExcerpt = (script: string) => script.split('\n').find((line) => line.trim())?.trim() ?? '';
  const formatDuration = (story: OdiiStoryItem) => {
    if (story.formattedDuration) return story.formattedDuration;
    const seconds = Number(story.playTime);
    return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '';
  };
  const moveRail = (direction: number) => {
    railRef.current?.scrollBy({ left: direction * 286, behavior: 'smooth' });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateRailEdges = () => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      const firstCardStart = (rail.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0;
      // 첫 카드가 레일의 시작점에 스냅된 상태도 index 0으로 취급한다.
      setIsAtStart(rail.scrollLeft <= firstCardStart + 4);
      setIsAtEnd(maxScrollLeft <= 4 || rail.scrollLeft >= maxScrollLeft - 4);
    };

    updateRailEdges();
    rail.addEventListener('scroll', updateRailEdges, { passive: true });
    window.addEventListener('resize', updateRailEdges);
    return () => {
      rail.removeEventListener('scroll', updateRailEdges);
      window.removeEventListener('resize', updateRailEdges);
    };
  }, [stories.length]);

  return (
    <section className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#655b4d]">가까운 장소의 이야기를 좌우로 살펴보세요.</p>
        <span className="text-xs text-[#786d5e]">좌우로 이동</span>
      </div>
      <div className="relative -mx-4 sm:-mx-8">
      <div ref={railRef} className="flex snap-x snap-mandatory space-x-4 overflow-x-auto px-10 pb-10 pt-4 sm:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <button
              type="button"
              key={story.stid}
              onClick={() => handleCardClick(story)}
              aria-pressed={isCurrent}
              className={`group w-[15.3rem] snap-start flex-shrink-0 overflow-hidden rounded-2xl border text-left shadow-[0_10px_28px_rgba(61,45,29,0.08)] transition-all duration-300 sm:w-[17rem] ${
                isCurrent
                  ? 'border-[#a94d35] bg-[#f5e3d7] ring-1 ring-[#a94d35]/20'
                  : 'border-[#cfc1b0] bg-[#fbf8f2] hover:-translate-y-1 hover:border-[#a94d35] hover:shadow-[0_18px_34px_rgba(61,45,29,0.14)]'
              }`}
            >
              {/* 이미지 썸네일 & 뱃지 */}
              <div className="relative mb-3 h-40 w-full overflow-hidden bg-[#d8cfbf] sm:h-44">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {story.distance && (
                  <span className="absolute left-3 top-3 rounded-full border border-black/10 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#211e19] shadow-[0_4px_12px_rgba(0,0,0,0.16)]">
                    {story.distance} <span className="mx-1 text-[#8a7c6a]">·</span><span className="text-[#655b4d]">내 주변</span>
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#d56748] flex items-center justify-center shadow-md">
                      {isThisPlaying ? (
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white">
                      {isThisPlaying ? '일시정지' : '듣기'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 텍스트 정보 */}
              <div className="p-4">
                <span className="mb-1 block text-[11px] font-semibold text-[#a94d35]">
                  {story.category}
                </span>
                <h3 className="font-odii-sans text-lg font-semibold text-[#211e19] line-clamp-1 transition-colors group-hover:text-[#a94d35]">
                  {story.title}
                </h3>
                <p className="mt-1 text-xs text-[#655b4d] line-clamp-1">{story.locationName}</p>
                <p className="mt-2.5 min-h-10 text-sm leading-5 text-[#655b4d] line-clamp-2">{getScriptExcerpt(story.script)}</p>
                <div className="mt-3 flex items-center border-t border-[#211e19]/10 pt-3 text-xs text-[#655b4d]">
                  <span>⏱ {formatDuration(story)}</span>
                  <span className="mx-2 text-[#b5a795]">•</span>
                  <span className="truncate">{story.speaker || '온마루 도슨트'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
        <AnimatePresence initial={false}>
          {!isAtStart && <motion.div key="left-rail-control" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="absolute inset-y-0 left-0 z-10">
            <div className="pointer-events-none h-full w-10 bg-gradient-to-r from-white via-white/85 to-transparent sm:w-16" />
            <button type="button" onClick={() => moveRail(-1)} className="absolute left-3 top-[42%] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#211e19]/15 bg-white/95 text-[#594b3e] shadow-[0_8px_20px_rgba(61,45,29,0.12)] transition duration-300 hover:scale-105 hover:border-[#a94d35] hover:bg-[#a94d35] hover:text-white sm:left-5" aria-label="이전 이야기">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.7]"><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></svg>
            </button>
          </motion.div>}
          {!isAtEnd && <motion.div key="right-rail-control" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="absolute inset-y-0 right-0 z-10">
            <div className="pointer-events-none h-full w-10 bg-gradient-to-l from-white via-white/85 to-transparent sm:w-16" />
            <button type="button" onClick={() => moveRail(1)} className="absolute right-3 top-[42%] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#211e19]/15 bg-white/95 text-[#594b3e] shadow-[0_8px_20px_rgba(61,45,29,0.12)] transition duration-300 hover:scale-105 hover:border-[#a94d35] hover:bg-[#a94d35] hover:text-white sm:right-5" aria-label="다음 이야기">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.7]"><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></svg>
            </button>
          </motion.div>}
        </AnimatePresence>
      </div>
    </section>
  );
};
