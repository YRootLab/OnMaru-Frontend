'use client';

import React, { useState } from 'react';
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

  const [isExpandedAll, setIsExpandedAll] = useState(false);

  const handlePlayClick = (story: OdiiStoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const visibleStories = isExpandedAll ? stories : stories.slice(0, 4);

  if (stories.length === 0) {
    return (
      <div className="w-full py-16 text-center text-[#786050]">
        <span className="text-4xl block mb-2">🏯</span>
        <p className="text-sm font-medium">검색 조건에 일치하는 한옥 이야기가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-4">
      {/* 아카이브 상단 요약 바 */}
      <div className="flex items-center justify-between px-2 pb-2 text-xs text-[#786050] border-b border-[#EAE0D0]">
        <span className="font-semibold text-[#2A1A0A]">
          총 <strong className="text-[#D42058] font-extrabold">{stories.length}개</strong>의 한옥 오디 도슨트 목록
        </span>
        <button
          onClick={() => setIsExpandedAll(!isExpandedAll)}
          className="px-3 py-1 bg-[#FFF0F4] hover:bg-[#D42058] hover:text-white text-[#D42058] rounded-full font-bold text-xs transition-colors flex items-center gap-1 border border-[#F8A8C0]/40"
        >
          {isExpandedAll ? '▲ 접기' : '▼ 전체보기'}
        </button>
      </div>

      {/* 리스트 아이템 모음 */}
      <div className="space-y-3">
        {visibleStories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={story.stid}
              onClick={() => setCurrentStory(story)}
              className={`group flex items-center justify-between p-4 rounded-2xl bg-white border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
                isCurrent
                  ? 'border-[#D42058] bg-[#FFF0F4]/40 ring-1 ring-[#D42058]/30 scale-[1.005]'
                  : 'border-[#EAE0D0] hover:border-[#F8A8C0]'
              }`}
            >
              {/* 좌측 섬네일 + 정보 */}
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5EFE6] border border-[#EAE0D0]">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isThisPlaying && (
                    <div className="absolute inset-0 bg-[#D42058]/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-white text-xs font-extrabold animate-pulse">● PLAY</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-bold bg-[#FFF0F4] text-[#D42058] rounded-md border border-[#F8A8C0]/30">
                      {story.category}
                    </span>
                    <span className="text-xs text-[#786050]">
                      📍 {story.locationName || '서울 종로구'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#2A1A0A] truncate group-hover:text-[#D42058] transition-colors font-serif">
                    {story.title}
                  </h4>

                  <p className="text-xs text-[#786050] truncate">
                    {story.audioTitle} • {story.speaker || '온마루 해설사'} • ⏱ {story.formattedDuration || '8:24'}
                  </p>
                </div>
              </div>

              {/* 우측 재생 버튼 */}
              <button
                onClick={(e) => handlePlayClick(story, e)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ml-3 ${
                  isThisPlaying
                    ? 'bg-[#D42058] text-white shadow-lg scale-105'
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

      {/* 전체보기 토글 버튼 */}
      {stories.length > 4 && (
        <div className="text-center pt-3">
          <button
            onClick={() => setIsExpandedAll(!isExpandedAll)}
            className="w-full py-3 bg-[#FAF6F0] hover:bg-[#FFF0F4] border border-[#EAE0D0] text-[#D42058] font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>{isExpandedAll ? '목록 접기' : `이야기 컬렉션 전체보기 (${stories.length}개 전체)`}</span>
            <span>{isExpandedAll ? '▲' : '▼'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
