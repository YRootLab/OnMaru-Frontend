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
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.12, 1, 0.2, 1],
    },
  },
};

function getScriptExcerpt(script = ''): string {
  if (!script) return '장소에 머무는 시간을 오디오 도슨트로 만나보세요.';
  const line = script.split(/\r?\n/).find((item) => item.trim());
  const text = line?.trim() || script.trim();
  return text.length > 55 ? `${text.slice(0, 54)}…` : text;
}

export const EditorialStoryList: React.FC<EditorialStoryListProps> = ({
  stories,
  onBookmarkStory,
  bookmarkedIds = new Set(),
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
      {/* 첫 이야기에 더 넓은 호흡을 주는 3열 매거진 그리드 */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="mt-3 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      >

        {stories.map((story, index) => {
          const isCurrent = currentStory.stid === story.stid;
          const isThisPlaying = isCurrent && isPlaying;
          const isSaved = bookmarkedIds.has(story.stid);

          return (
            <motion.div
              key={story.stid}
              variants={itemVariants}
              onClick={() => selectStory(story)}
              className={`group flex cursor-pointer flex-col overflow-hidden border-b border-[#211e19]/15 bg-white pb-4 transition-all duration-300 ${
                index === 0 ? 'lg:col-span-2' : ''
              } ${
                isCurrent
                  ? 'border-b-[#a94d35]'
                  : 'hover:border-b-[#a94d35]/60'
              }`}
            >
              <div className={`relative w-full overflow-hidden bg-[#e8e0d5] ${index === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                <img
                  src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                  alt={story.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="h-full w-full object-cover grayscale-[0.08] transition-transform duration-700 group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={(e) => handlePlayClick(story, e)}
                  aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
                  className={`absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isThisPlaying
                      ? 'bg-[#a94d35] text-white'
                      : 'bg-[#fbf8f2] text-[#211e19] hover:bg-[#a94d35] hover:text-white'
                  }`}
                  title={isThisPlaying ? '일시정지' : '재생'}
                >
                  {isThisPlaying ? (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="ml-0.5 h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>

              </div>

              <div className="flex flex-1 flex-col justify-between pt-4">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[10px] font-semibold text-[#a94d35]">
                      {story.category} <span className="mx-1 text-[#b8aa9a]">·</span> {story.locationName || '대한민국 문화 공간'}
                    </p>
                    {onBookmarkStory && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onBookmarkStory(story);
                        }}
                        aria-label={isSaved ? `${story.title} 보관함에서 삭제` : `${story.title} 마음에 담기`}
                        aria-pressed={isSaved}
                        className={`shrink-0 text-lg leading-none transition-colors ${isSaved ? 'text-[#a94d35]' : 'text-[#b1a396] hover:text-[#a94d35]'}`}
                      >
                        {isSaved ? '♥' : '♡'}
                      </button>
                    )}
                  </div>
                  <h4 className={`mt-2 font-odii-sans text-lg font-bold leading-snug tracking-tight transition-colors sm:text-xl ${
                    isCurrent ? 'text-[#a94d35]' : 'text-[#211e19] group-hover:text-[#a94d35]'
                  }`}>
                    {story.title}
                  </h4>
                  <p className="mt-1 line-clamp-1 text-xs text-[#786d5e]">
                    {story.audioTitle}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8c7e6c]">
                    “{getScriptExcerpt(story.script)}”
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-[10px] text-[#8c7e6c]">
                  <span className="truncate">{story.speaker || '오디 도슨트'}</span>
                  <span className="shrink-0 font-mono">{story.formattedDuration || '오디오'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
