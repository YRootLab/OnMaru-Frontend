'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface EditorialStoryListProps {
  stories: OdiiStoryItem[];
}

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

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

          return (
            <motion.div
              key={story.stid}
              variants={itemVariants}
              onClick={() => selectStory(story)}
              className={`group flex cursor-pointer items-center justify-between py-3 px-2.5 rounded-xl transition-all duration-300 ${
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

              {/* 우측: 재생시간 + 재생 버튼 */}
              <div className="flex items-center space-x-3 shrink-0">
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
