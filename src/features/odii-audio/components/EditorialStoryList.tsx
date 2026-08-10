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

const LIST_FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

const imageFor = (story: OdiiStoryItem, index: number) => {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return LIST_FALLBACK_IMAGES[seed % LIST_FALLBACK_IMAGES.length];
};

const categoryLabelFor = (story: OdiiStoryItem) => {
  const categoryLabels: Record<string, string> = {
    한옥: '한옥/고택',
    시장: '전통시장',
    마을: '전통마을',
    궁: '궁궐/역사',
    길: '자연/둘레길',
  };
  if (story.category && story.category !== '오디 이야기') return categoryLabels[story.category] || story.category;
  if (story.title.includes('한옥') || story.title.includes('고택')) return '한옥/고택';
  if (story.title.includes('시장')) return '전통시장';
  if (story.title.includes('궁') || story.title.includes('왕')) return '궁궐/역사';
  return story.badgeText === '음원 제공' ? '문화유산' : '오디오 가이드';
};

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
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
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
              className={`group relative grid cursor-pointer grid-cols-[34px_64px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3.5 transition-all duration-300 sm:grid-cols-[40px_76px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 ${
                isCurrent
                  ? 'border-[#f84e76]/45 bg-[#fff0f5] shadow-[0_12px_30px_rgba(248,78,118,0.12)]'
                  : 'border-[#211e19]/8 bg-white/70 hover:-translate-y-0.5 hover:border-[#f84e76]/25 hover:bg-[#fff8fa] hover:shadow-[0_10px_24px_rgba(248,78,118,0.08)]'
              }`}
            >
              <div className="flex h-full items-center justify-center border-r border-[#211e19]/8 pr-2">
                <div className="w-6 shrink-0 text-center">
                  {isThisPlaying ? (
                    <div className="flex items-end justify-center space-x-0.5 h-3.5">
                      <span className="h-3 w-0.5 rounded-full bg-[#f84e76] animate-[bounce_0.6s_infinite_100ms]" />
                      <span className="h-2 w-0.5 rounded-full bg-[#f84e76] animate-[bounce_0.6s_infinite_300ms]" />
                      <span className="h-3.5 w-0.5 rounded-full bg-[#f84e76] animate-[bounce_0.6s_infinite_200ms]" />
                    </div>
                  ) : (
                    <span className={`font-mono text-[11px] font-semibold ${isCurrent ? 'text-[#f84e76]' : 'text-[#8c7e6c]'}`}>
                      {trackNum}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f3eee8] ring-1 ring-black/5 sm:h-[68px] sm:w-[76px]">
                  <img
                    src={imageFor(story, index)}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = LIST_FALLBACK_IMAGES[0];
                    }}
                  />
                  {!story.imageUrl && <span className="absolute bottom-1 left-1 rounded bg-white/75 px-1 py-0.5 text-[8px] font-medium text-[#8c7e6c] backdrop-blur-sm">참고용</span>}
                  {isThisPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#f84e76]/75 backdrop-blur-xs">
                      <span className="text-[9px] font-bold text-white tracking-widest uppercase">PLAY</span>
                    </div>
                  )}
              </div>

              <div className="min-w-0 pr-1">
                <div className="mb-1 flex min-w-0 items-center gap-2 text-[10px]">
                  <span className="truncate font-bold text-[#f84e76]">{categoryLabelFor(story)}</span>
                  <span className="truncate text-[#8c7e6c]">{story.locationName || '대한민국 문화유산'}</span>
                </div>

                <h4 className={`truncate font-odii-sans text-sm font-semibold tracking-[-0.025em] transition-colors sm:text-base ${isCurrent ? 'text-[#f84e76]' : 'text-[#211e19] group-hover:text-[#f84e76]'}`}>
                  {story.title}
                </h4>
                <p className="mt-1 truncate text-[10px] text-[#786d5e] sm:text-[11px]">{story.locationName || '대한민국 문화유산'}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
                        ? 'scale-105 bg-[#f84e76]/12 text-[#f84e76] hover:bg-[#f84e76]/20'
                        : 'text-[#b0a398] hover:bg-[#f84e76]/10 hover:text-[#f84e76]'
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

                <span className="hidden font-mono text-[11px] text-[#8c7e6c] sm:inline-block">
                  {story.formattedDuration || '3:00'}
                </span>

                <button
                  type="button"
                  onClick={(e) => handlePlayClick(story, e)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    isThisPlaying
                      ? 'scale-105 bg-[#f84e76] text-white shadow-[0_6px_16px_rgba(248,78,118,0.28)]'
                      : 'border border-[#f84e76]/25 bg-white text-[#f84e76] hover:bg-[#f84e76] hover:text-white'
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
