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
  const selectStory = useOdiiAudioStore((s) => s.selectStory);
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
      <div className="w-full py-16 text-center text-[#655b4d]">
        <p className="text-sm font-medium">검색 조건에 일치하는 이야기가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* 아카이브 상단 요약 바 */}
      <div className="flex items-center justify-between pb-4 text-xs text-[#655b4d] border-b border-[#211e19]/20">
        <span className="font-semibold text-[#211e19]">
          총 <strong className="text-[#a94d35] font-extrabold">{stories.length}개</strong>의 오디오 이야기
        </span>
        <span>스크롤하여 탐색</span>
      </div>

      {/* 리스트 아이템 모음 */}
      <div className="pt-2">
        {stories.map((story) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={story.stid}
              onClick={() => selectStory(story)}
              className="group relative z-0 flex cursor-pointer items-center justify-between py-2 transition-all duration-300 hover:z-10"
            >
              <div className={`relative flex w-full items-center justify-between rounded-2xl border px-3 py-3 transition-all duration-300 sm:px-4 ${isCurrent ? 'border-2 border-[#D42058] bg-transparent shadow-[0_12px_24px_rgba(115,75,48,0.12)]' : 'border-transparent bg-transparent group-hover:border-[#d8cbb9] group-hover:bg-[#fbf8f2] group-hover:shadow-[0_20px_28px_-16px_rgba(61,45,29,0.36)]'}`}>
                {/* 좌측 섬네일 + 정보 */}
                <div className="flex min-w-0 items-center space-x-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#d8cfbf] sm:h-20 sm:w-20">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className={`h-full w-full object-cover transition-transform duration-500 ${isCurrent ? 'scale-105' : 'group-hover:scale-105'}`}
                  />
                  {isThisPlaying && (
                    <div className="absolute inset-0 bg-[#a94d35]/70 flex items-center justify-center">
                      <span className="animate-pulse text-xs font-extrabold text-white">● 재생 중</span>
                    </div>
                  )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] sm:text-xs font-semibold text-[#a94d35]">
                        {story.category}
                      </span>
                      <span className="text-xs text-[#655b4d]">
                        {story.locationName || '관광지 오디오 가이드'}
                      </span>
                    </div>

                    <h4 className={`font-maruburi text-sm font-semibold truncate transition-colors sm:text-base ${isCurrent ? 'text-[#a94d35]' : 'text-[#211e19] group-hover:text-[#a94d35]'}`}>
                      {story.title}
                    </h4>

                    <p className="text-xs text-[#655b4d] truncate">
                      {story.audioTitle} · {story.formattedDuration || '8:24'}
                    </p>
                    <p className="hidden max-w-xl text-xs leading-5 text-[#786d5e] line-clamp-1 sm:block">
                      {story.script.split('\n').find((line) => line.trim())?.trim()}
                    </p>
                  </div>
                </div>

                {/* 우측 재생 버튼 */}
                <button
                  onClick={(e) => handlePlayClick(story, e)}
                  className={`ml-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 ${
                    isThisPlaying
                      ? 'scale-105 bg-[#a94d35] text-white shadow-[0_8px_18px_rgba(169,77,53,0.3)]'
                      : 'border border-[#211e19]/20 text-[#211e19] group-hover:border-[#a94d35] group-hover:bg-[#a94d35] group-hover:text-white hover:scale-105'
                  }`}
                  title={isThisPlaying ? '일시정지' : '재생'}
                >
                  {isThisPlaying ? (
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              </div>
              <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b9ab99]/70 to-transparent group-hover:opacity-0" />
            </div>
          );
        })}
      </div>

    </div>
  );
};
