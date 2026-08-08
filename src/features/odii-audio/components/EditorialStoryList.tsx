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
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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

function formatDuration(story: OdiiStoryItem): string {
  if (story.formattedDuration) return story.formattedDuration;
  const seconds = Number(story.playTime);
  return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '오디오';
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
    <div className="w-full py-4">
      {/* 🎵 표준 음악 플레이어 트랙 리스트 그리드 (높이 ~100px, 80px 앨범 아키텍처) */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-3.5 lg:grid-cols-2"
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
              className={`group relative flex h-[104px] cursor-pointer items-center justify-between gap-3.5 overflow-hidden rounded-[1.25rem] border p-2.5 transition-all duration-300 ${
                isCurrent
                  ? 'border-[#a94d35]/50 bg-[#fffbf5] shadow-[0_8px_20px_rgba(169,77,53,0.12)] ring-1 ring-[#a94d35]/20'
                  : 'border-[#211e19]/08 bg-[#faf7f2]/90 hover:border-[#a94d35]/35 hover:bg-white hover:shadow-md'
              }`}
            >
              {/* 좌측 80px 정사각형 앨범 아트 섬네일 & 플레이 버튼 */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center font-mono text-xs font-bold text-[#b1a396] group-hover:text-[#a94d35]">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#d8cfbf]">
                  <img
                    src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                    alt={story.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* 호버 / 재생 상태 버블 */}
                  <button
                    type="button"
                    onClick={(e) => handlePlayClick(story, e)}
                    aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                      isThisPlaying ? 'bg-black/40 opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isThisPlaying ? (
                      <span className="inline-flex items-center gap-0.5">
                        <span className="h-3 w-0.5 animate-pulse bg-white" />
                        <span className="h-4 w-0.5 animate-pulse bg-white [animation-delay:0.15s]" />
                        <span className="h-2.5 w-0.5 animate-pulse bg-white [animation-delay:0.3s]" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#211e19] shadow-md">
                        <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    )}
                  </button>
                </div>

                {/* 중앙 텍스트 정보 영역 (높이 100px에 맞춰 밀도 높은 오디오 트랙 메타) */}
                <div className="flex flex-col justify-between py-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 rounded-full bg-[#a94d35]/10 px-2 py-0.5 text-[9.5px] font-bold text-[#a94d35]">
                      {story.category}
                    </span>
                    <span className="truncate text-[10px] font-medium text-[#8c7e6c]">
                      {story.locationName || '대한민국 문화유산'}
                    </span>
                  </div>

                  <h4 className={`mt-0.5 truncate font-odii-sans text-base font-bold leading-snug tracking-tight ${
                    isCurrent ? 'text-[#a94d35]' : 'text-[#211e19] group-hover:text-[#a94d35]'
                  }`}>
                    {story.title}
                  </h4>

                  <p className="line-clamp-1 text-[10.5px] text-[#655b4d]">
                    “{getScriptExcerpt(story.script)}”
                  </p>
                </div>
              </div>

              {/* 우측 재생 시간 & 마음에 담기 하트 */}
              <div className="flex shrink-0 items-center gap-3 pl-2">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-mono text-[11px] font-semibold text-[#655b4d]">{formatDuration(story)}</span>
                  <span className="truncate text-[9.5px] text-[#8c7e6c]">{story.speaker || '도슨트'}</span>
                </div>
                {onBookmarkStory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkStory(story);
                    }}
                    aria-label={isSaved ? `${story.title} 보관함에서 삭제` : `${story.title} 마음에 담기`}
                    aria-pressed={isSaved}
                    className={`text-lg leading-none transition-colors ${isSaved ? 'text-[#a94d35]' : 'text-[#c2b5a7] hover:text-[#a94d35]'}`}
                  >
                    {isSaved ? '♥' : '♡'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
