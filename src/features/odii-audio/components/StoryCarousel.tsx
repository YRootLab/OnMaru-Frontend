'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
}

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories }) => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);

  return (
    <section className="w-full py-6">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
        <div className="flex items-center space-x-2">
          <span className="text-[#D42058] font-bold text-xl">📍</span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A1A0A] tracking-tight">
            내 주변 이야기
          </h2>
        </div>
        <span className="text-xs sm:text-sm text-[#786050]">서울 종로구 기준</span>
      </div>

      {/* 가로 스크롤 카드 래퍼 */}
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 px-4 sm:px-0 scrollbar-hide">
        {stories.map((story) => {
          const isSelected = currentStory.stid === story.stid;
          return (
            <div
              key={story.stid}
              onClick={() => setCurrentStory(story)}
              className={`flex-shrink-0 w-64 sm:w-72 bg-white rounded-2xl p-3 border transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-[#D42058] ring-2 ring-[#D42058]/20'
                  : 'border-[#EAE0D0] hover:border-[#F8A8C0]'
              }`}
            >
              {/* 이미지 썸네일 & 뱃지 */}
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-[#F5EFE6]">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {story.distance && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur-md text-[#D42058] rounded-full shadow-sm">
                    📍 {story.distance}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    ▶ 지금 듣기
                  </span>
                </div>
              </div>

              {/* 텍스트 정보 */}
              <span className="text-xs font-bold text-[#D42058] block mb-1">
                {story.category}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#2A1A0A] line-clamp-1 group-hover:text-[#D42058] transition-colors">
                {story.title}
              </h3>
              <div className="flex items-center text-xs text-[#786050] mt-1 space-x-2">
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
