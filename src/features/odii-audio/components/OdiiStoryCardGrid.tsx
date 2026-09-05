'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Pause } from 'lucide-react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface OdiiStoryCardGridProps {
  stories: OdiiStoryItem[];
  isLoading?: boolean;
  onBookmarkStory?: (story: OdiiStoryItem) => void;
  bookmarkedIds?: Set<string>;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

const fallbackImageFor = (story: OdiiStoryItem, index: number) => {
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const categoryLabelFor = (story: OdiiStoryItem) => {
  const labels: Record<string, string> = {
    한옥: '한옥/고택', 시장: '전통시장', 마을: '전통마을', 궁: '궁궐/역사', 길: '자연/둘레길',
  };
  return labels[story.category] || (story.category !== '오디 이야기' ? story.category : '문화유산');
};

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-[22px]  bg-white/70 p-2">
    <div className="odii-skeleton h-44 rounded-[16px] bg-[#eee8df] sm:h-52" />
    <div className="space-y-3 px-3 pb-3 pt-4">
      <div className="odii-skeleton h-2.5 w-20 rounded bg-[#eee8df]" />
      <div className="odii-skeleton h-4 w-4/5 rounded bg-[#e8e0d5]" />
      <div className="odii-skeleton h-2.5 w-2/5 rounded bg-[#eee8df]" />
    </div>
  </div>
);

export const OdiiStoryCardGrid: React.FC<OdiiStoryCardGridProps> = ({
  stories,
  isLoading = false,
  onBookmarkStory,
  bookmarkedIds,
}) => {
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const handlePlay = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
      return;
    }
    setCurrentStory(story);
  };

  return (
    <div aria-busy={isLoading} className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} />)
          : stories.slice(0, 6).map((story, index) => {
            const isCurrent = currentStory.stid === story.stid;
            const isBookmarked = bookmarkedIds?.has(story.stid);
            const imageUrl = story.imageUrl || fallbackImageFor(story, index);

            return (
              <motion.article
                key={`${story.stid}-${index}`}
                layout
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`group flex min-h-[124px] items-center gap-3.5 rounded-2xl border p-3 backdrop-blur-md transition-all duration-300 ${
                  isCurrent
                    ? 'border-[#f84e76]/40 bg-gradient-to-r from-[#fff0f5] via-white to-white shadow-lg shadow-[#f84e76]/10 ring-1 ring-[#f84e76]/20'
                    : 'border-white/70 bg-white/80 hover:border-[#f84e76]/30 hover:bg-white/95 hover:shadow-xl hover:shadow-rose-950/5'
                }`}
              >
                {/* 썸네일 컨테이너: 크기 스케일 업 (104px -> 120px) & hover:scale-115 스케일 이펙트 */}
                <div className="relative h-[96px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#f3eee8] shadow-inner sm:h-[108px] sm:w-[118px]">
                  <img
                    src={imageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-115"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGES[0];
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5 transition-opacity duration-300 group-hover:opacity-90" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlay(story)}
                    aria-label={`${story.title} ${isCurrent && isPlaying ? '일시정지' : '재생'}`}
                    className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-300 group-hover:scale-110 ${
                      isCurrent
                        ? 'bg-[#f84e76] text-white shadow-[#f84e76]/40'
                        : 'bg-white/95 text-[#f84e76] shadow-black/10 hover:bg-[#f84e76] hover:text-white'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1 py-1 pr-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate rounded-md bg-[#f84e76]/10 px-2 py-0.5 text-[10px] font-bold text-[#f84e76]">
                      {categoryLabelFor(story)}
                    </span>
                    {onBookmarkStory && (
                      <button
                        type="button"
                        onClick={() => onBookmarkStory(story)}
                        aria-label={isBookmarked ? '마음에서 삭제' : '마음에 담기'}
                        className={`transition-all duration-200 hover:scale-125 ${
                          isBookmarked ? 'text-[#f84e76]' : 'text-[#b0a398] hover:text-[#f84e76]'
                        }`}
                      >
                        <Heart size={16} className={isBookmarked ? 'fill-current' : ''} />
                      </button>
                    )}
                  </div>
                  <h4 className="line-clamp-2 min-h-[38px] font-odii-sans text-sm font-bold leading-snug tracking-[-0.03em] text-[#211e19] transition-colors group-hover:text-[#f84e76]">
                    {story.title}
                  </h4>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#8c7e6c]">
                    <span className="truncate font-medium">{story.locationName || '대한민국 문화유산'}</span>
                    <span className="shrink-0 font-mono font-semibold">{story.formattedDuration || '3:00'}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
      </div>
    </div>
  );
};
