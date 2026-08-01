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
      <div className="w-full py-16 text-center text-[#655b4d]">
        <p className="text-sm font-medium">검색 조건에 일치하는 이야기가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 space-y-0">
      {/* 아카이브 상단 요약 바 */}
      <div className="flex items-center justify-between pb-4 text-xs text-[#655b4d] border-b border-[#211e19]/20">
        <span className="font-semibold text-[#211e19]">
          총 <strong className="text-[#a94d35] font-extrabold">{stories.length}개</strong>의 오디오 이야기
        </span>
        <button
          onClick={() => setIsExpandedAll(!isExpandedAll)}
          className="text-[#211e19] font-semibold text-xs transition-colors hover:text-[#a94d35]"
        >
          {isExpandedAll ? '▲ 접기' : '▼ 전체보기'}
        </button>
      </div>

      {/* 리스트 아이템 모음 */}
      <div>
        {visibleStories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={story.stid}
              onClick={() => setCurrentStory(story)}
              className={`group flex items-center justify-between py-5 border-b transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? 'border-[#a94d35] bg-[#f1e5d6]/70 px-3'
                  : 'border-[#211e19]/15 hover:border-[#a94d35]'
              }`}
            >
              {/* 좌측 섬네일 + 정보 */}
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden flex-shrink-0 bg-[#d8cfbf]">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isThisPlaying && (
                    <div className="absolute inset-0 bg-[#a94d35]/70 flex items-center justify-center">
                      <span className="text-white text-xs font-extrabold animate-pulse">● PLAY</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-[#a94d35]">
                      {story.category}
                    </span>
                    <span className="text-xs text-[#655b4d]">
                      {story.locationName || '서울 종로구'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-[#211e19] truncate group-hover:text-[#a94d35] transition-colors font-serif">
                    {story.title}
                  </h4>

                  <p className="text-xs text-[#655b4d] truncate">
                    {story.audioTitle} · {story.formattedDuration || '8:24'}
                  </p>
                </div>
              </div>

              {/* 우측 재생 버튼 */}
              <button
                onClick={(e) => handlePlayClick(story, e)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ml-3 ${
                  isThisPlaying
                    ? 'bg-[#a94d35] text-white scale-105'
                    : 'border border-[#211e19]/20 text-[#211e19] hover:bg-[#a94d35] hover:border-[#a94d35] hover:text-white'
                }`}
                title={isThisPlaying ? '일시정지' : '재생'}
              >
                {isThisPlaying ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
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
            className="w-full py-4 border-b border-[#211e19]/20 text-[#211e19] font-semibold text-xs sm:text-sm transition-all hover:text-[#a94d35] flex items-center justify-center gap-2"
          >
            <span>{isExpandedAll ? '목록 접기' : `이야기 컬렉션 전체보기 (${stories.length}개 전체)`}</span>
            <span>{isExpandedAll ? '▲' : '▼'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
