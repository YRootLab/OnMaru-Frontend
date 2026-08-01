'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface EditorialStoryListProps {
  stories: OdiiStoryItem[];
}

export const EditorialStoryList: React.FC<EditorialStoryListProps> = ({ stories }) => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const handlePlayClick = (story: OdiiStoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  if (stories.length === 0) {
    return (
      <div className="w-full py-16 text-center text-[#786050]">
        <span className="text-4xl block mb-2">🏯</span>
        <p className="text-sm font-medium">검색 조건에 일치하는 한옥 이야기가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 py-4">
      {stories.map((story) => {
        const isCurrent = currentStory.stid === story.stid;
        const isThisPlaying = isCurrent && isPlaying;

        return (
          <div
            key={story.stid}
            onClick={() => setCurrentStory(story)}
            className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
              isCurrent
                ? 'border-[#D42058] bg-[#FFF0F4]/30 ring-1 ring-[#D42058]/30'
                : 'border-[#EAE0D0] hover:border-[#F8A8C0]'
            }`}
          >
            {/* 좌측 섬네일 + 정보 */}
            <div className="flex items-center space-x-4 min-w-0">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5EFE6]">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-[#FFF0F4] text-[#D42058] rounded-md border border-[#F8A8C0]/30">
                    {story.category}
                  </span>
                  <span className="text-[11px] text-[#786050]">
                    ⏱ {story.formattedDuration || '8:24'}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#2A1A0A] truncate group-hover:text-[#D42058] transition-colors">
                  {story.title}
                </h4>
                <p className="text-xs text-[#786050] truncate mt-0.5">
                  {story.audioTitle} • {story.speaker || '온마루 해설사'}
                </p>
              </div>
            </div>

            {/* 우측 재생 버튼 */}
            <button
              onClick={(e) => handlePlayClick(story, e)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ml-3 ${
                isThisPlaying
                  ? 'bg-[#D42058] text-white shadow-md scale-105'
                  : 'bg-[#FFF0F4] text-[#D42058] hover:bg-[#D42058] hover:text-white'
              }`}
              title={isThisPlaying ? '일시정지' : '재생'}
            >
              {isThisPlaying ? '⏸' : '▶'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
