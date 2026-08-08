'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface EditorialStoryListProps {
  stories: OdiiStoryItem[];
  onBookmarkStory?: (story: OdiiStoryItem) => void;
  bookmarkedIds?: Set<string>;
}

export const EditorialStoryListSkeleton: React.FC = () => (
  <div aria-label="트랙 목록 로딩 중" className="w-full py-3" aria-busy="true">
    <div className="flex items-center justify-between border-b border-[#211e19]/10 pb-2 text-[11px]">
      <div className="odii-skeleton h-3.5 w-28 rounded bg-[#e8e0d5]" />
      <div className="odii-skeleton h-3 w-16 rounded bg-[#eee8df]" />
    </div>
    <div className="divide-y divide-[#211e19]/5">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 rounded-xl px-2.5 py-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="odii-skeleton h-3 w-6 rounded bg-[#eee8df]" />
            <div className="odii-skeleton h-11 w-11 shrink-0 rounded-lg bg-[#e8e0d5] sm:h-13 sm:w-13" />
            <div className="min-w-0 space-y-2">
              <div className="odii-skeleton h-2.5 w-24 rounded bg-[#e8e0d5]" />
              <div className="odii-skeleton h-3.5 w-40 rounded bg-[#dfd5c8] sm:w-64" />
              <div className="odii-skeleton h-2.5 w-28 rounded bg-[#eee8df]" />
            </div>
          </div>
          <div className="odii-skeleton h-8 w-8 shrink-0 rounded-full bg-[#e8e0d5]" />
        </div>
      ))}
    </div>
  </div>
);

const listContainerVariants: Variants = {
  hidden: { opacity: 0.92 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0.92 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

export const EditorialStoryList: React.FC<EditorialStoryListProps> = ({
  stories,
  onBookmarkStory,
  bookmarkedIds,
}) => {
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
        <p className="text-xs font-medium">선택한 조건에 해당하는 오디오 가이드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-3">
    <div className="flex items-center justify-between pb-2 text-[11px] text-[#8c7e6c] border-b border-[#211e19]/10">
        <span className="font-semibold text-[#211e19]">
          트랙 아카이브 <strong className="text-[#a94d35] font-extrabold ml-1">{stories.length}</strong>
        </span>
      </div>

      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="divide-y divide-[#211e19]/5"
      >
        {stories.map((story, index) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;
          const trackNum = String(index + 1).padStart(2, '0');
          const isBookmarked = bookmarkedIds?.has(story.stid);

          return (
            <motion.div
              key={story.stid}
              variants={itemVariants}
              onClick={() => selectStory(story)}
              className={`group flex cursor-pointer items-center justify-between py-3 px-2.5 rounded-xl transition-all duration-200 ${
                isCurrent
                  ? 'bg-[#f4ebe1] text-[#211e19] ring-1 ring-[#a94d35]/20 shadow-xs'
                  : 'hover:bg-[#f9f6f0]'
              }`}
            >
              {/* 좌측: 트랙 번호 + 섬네일 + 정보 */}
              <div className="flex min-w-0 items-center space-x-3.5">
                {/* 트랙 번호 / 라이브 이퀄라이저 아이콘 */}
                <div className="w-6 shrink-0 text-center">
                  {isThisPlaying ? (
                    <div className="flex items-end justify-center space-x-0.5 h-3.5">
                      <span className="w-0.5 bg-[#a94d35] rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                      <span className="w-0.5 bg-[#a94d35] rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
                      <span className="w-0.5 bg-[#a94d35] rounded-full animate-[bounce_0.6s_infinite_200ms] h-3.5" />
                    </div>
                  ) : (
                    <span className={`text-[11px] font-mono font-semibold ${isCurrent ? 'text-[#a94d35]' : 'text-[#8c7e6c]'}`}>
                      {trackNum}
                    </span>
                  )}
                </div>

                {/* 섬네일 앨범아트 */}
                <div className="relative h-11 w-11 sm:h-13 sm:w-13 shrink-0 overflow-hidden rounded-lg bg-[#e8e0d5] ring-1 ring-black/5">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {isThisPlaying && (
                    <div className="absolute inset-0 bg-[#a94d35]/80 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white tracking-widest uppercase">PLAY</span>
                    </div>
                  )}
                </div>

                {/* 정보 (제목 / 장소 / 카테고리) */}
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-[#a94d35]">
                      {story.category}
                    </span>
                    <span className="text-[10px] text-[#8c7e6c] truncate max-w-[130px] sm:max-w-none">
                      · {story.locationName || '대한민국 문화유산'}
                    </span>
                  </div>

                  <h4 className={`font-odii-sans text-xs sm:text-sm font-semibold truncate transition-colors ${isCurrent ? 'text-[#a94d35]' : 'text-[#211e19] group-hover:text-[#a94d35]'}`}>
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-[#786d5e] truncate">
                    {story.audioTitle}
                  </p>
                </div>
              </div>

              {/* 우측: 보관함 하트 SVG + 재생시간 + 재생 버튼 */}
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                {onBookmarkStory && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onBookmarkStory(story);
                    }}
                    aria-label={isBookmarked ? `${story.title} 보관함에서 삭제` : `${story.title} 마음에 담기`}
                    aria-pressed={isBookmarked}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isBookmarked
                        ? 'text-[#a94d35] bg-[#a94d35]/10 hover:bg-[#a94d35]/20 scale-105'
                        : 'text-[#8c7e6c] hover:bg-[#211e19]/5 hover:text-[#a94d35]'
                    }`}
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      {isBookmarked ? (
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      ) : (
                        <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.73C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                      )}
                    </svg>
                  </button>
                )}

                <span className="hidden sm:inline-block text-[11px] font-mono text-[#8c7e6c]">
                  {story.formattedDuration || '3:00'}
                </span>

                <button
                  type="button"
                  onClick={(e) => handlePlayClick(story, e)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    isThisPlaying
                      ? 'bg-[#a94d35] text-white shadow-xs scale-105'
                      : 'bg-white border border-[#211e19]/15 text-[#211e19] hover:bg-[#211e19] hover:border-[#211e19] hover:text-white'
                  }`}
                  title={isThisPlaying ? '일시정지' : '재생'}
                >
                  {isThisPlaying ? (
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
