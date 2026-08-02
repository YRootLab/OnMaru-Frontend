'use client';

import React, { useRef } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
}

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories }) => {
  const railRef = useRef<HTMLDivElement | null>(null);
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
    railRef.current?.scrollBy({ left: direction * 336, behavior: 'smooth' });
  };

  return (
    <section className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#655b4d]">가까운 장소의 이야기를 좌우로 살펴보세요.</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => moveRail(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#211e19]/20 text-[#211e19] transition hover:border-[#a94d35] hover:bg-[#a94d35] hover:text-white" aria-label="이전 이야기">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m14 5-7 7 7 7" /></svg>
          </button>
          <button type="button" onClick={() => moveRail(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#211e19] text-white transition hover:bg-[#a94d35]" aria-label="다음 이야기">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m10 5 7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div ref={railRef} className="flex snap-x snap-mandatory space-x-5 overflow-x-auto px-1 pb-5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <button
              type="button"
              key={story.stid}
              onClick={() => handleCardClick(story)}
              aria-pressed={isCurrent}
              className={`group w-72 snap-start flex-shrink-0 overflow-hidden rounded-2xl border text-left shadow-[0_10px_28px_rgba(61,45,29,0.08)] transition-all duration-300 sm:w-80 ${
                isCurrent
                  ? 'border-[#a94d35] bg-[#f5e3d7] ring-1 ring-[#a94d35]/20'
                  : 'border-[#cfc1b0] bg-[#fbf8f2] hover:-translate-y-1 hover:border-[#a94d35] hover:shadow-[0_18px_34px_rgba(61,45,29,0.14)]'
              }`}
            >
              {/* 이미지 썸네일 & 뱃지 */}
              <div className="relative mb-4 h-48 w-full overflow-hidden bg-[#d8cfbf] sm:h-52">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {story.distance && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold bg-[#f7f0e4]/90 text-[#211e19]">
                    {story.distance} · 내 주변
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
              <div className="p-5">
                <span className="mb-1 block text-[11px] font-semibold text-[#a94d35]">
                  {story.category}
                </span>
                <h3 className="font-maruburi text-lg font-semibold text-[#211e19] line-clamp-1 transition-colors group-hover:text-[#a94d35]">
                  {story.title}
                </h3>
                <p className="mt-1 text-xs text-[#655b4d] line-clamp-1">{story.locationName}</p>
                <p className="mt-3 min-h-10 text-sm leading-5 text-[#655b4d] line-clamp-2">{getScriptExcerpt(story.script)}</p>
                <div className="mt-4 flex items-center border-t border-[#211e19]/10 pt-3 text-xs text-[#655b4d]">
                  <span>⏱ {formatDuration(story)}</span>
                  <span className="mx-2 text-[#b5a795]">•</span>
                  <span className="truncate">{story.speaker || '온마루 도슨트'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
