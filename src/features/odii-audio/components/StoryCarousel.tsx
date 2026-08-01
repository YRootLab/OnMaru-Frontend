'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
}

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories }) => {
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

  return (
    <section className="w-full">
      {/* 가로 스크롤 카드 래퍼 */}
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 px-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={story.stid}
              onClick={() => handleCardClick(story)}
              className={`flex-shrink-0 w-64 sm:w-72 border-b transition-all duration-300 cursor-pointer group ${
                isCurrent
                  ? 'border-[#a94d35] bg-[#ead8c5]'
                  : 'border-[#211e19]/25 hover:border-[#a94d35]'
              }`}
            >
              {/* 이미지 썸네일 & 뱃지 */}
              <div className="relative w-full h-52 overflow-hidden mb-4 bg-[#d8cfbf]">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {story.distance && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold bg-[#f7f0e4]/90 text-[#211e19]">
                    {story.distance}
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
              <span className="text-[11px] font-semibold text-[#a94d35] block mb-1">
                {story.category}
              </span>
              <h3 className="text-base font-semibold text-[#211e19] line-clamp-1 group-hover:text-[#a94d35] transition-colors font-serif">
                {story.title}
              </h3>
              <div className="flex items-center text-xs text-[#655b4d] mt-1 space-x-2">
                <span>⏱ {story.formattedDuration || '8:24'}</span>
                <span>•</span>
                <span className="truncate">{story.speaker || '온마루 도슨트'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
