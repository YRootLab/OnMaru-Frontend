'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Pause } from 'lucide-react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

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
  <div className="overflow-hidden rounded-[22px] border border-[#211e19]/8 bg-white/70 p-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
                className={`group flex min-h-[116px] items-center gap-3 rounded-2xl border p-2.5 transition-shadow duration-300 ${isCurrent ? 'border-[#f84e76]/45 bg-[#fff0f5] shadow-[0_12px_26px_rgba(248,78,118,0.12)]' : 'border-[#211e19]/8 bg-white/75 hover:border-[#f84e76]/25 hover:shadow-[0_12px_26px_rgba(248,78,118,0.08)]'}`}
              >
                <div className="relative h-[88px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-[#f3eee8]">
                  <img
                    src={imageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGES[0];
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-1 font-mono text-[9px] font-semibold text-[#655b4d] backdrop-blur-sm">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlay(story)}
                    aria-label={`${story.title} ${isCurrent && isPlaying ? '일시정지' : '재생'}`}
                    className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105 ${isCurrent ? 'bg-[#f84e76] text-white' : 'bg-white/95 text-[#f84e76]'}`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1 py-1 pr-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-semibold text-[#f84e76]">{categoryLabelFor(story)}</span>
                    {onBookmarkStory && (
                      <button
                        type="button"
                        onClick={() => onBookmarkStory(story)}
                        aria-label={isBookmarked ? '마음에서 삭제' : '마음에 담기'}
                        className={`transition-colors hover:scale-110 ${isBookmarked ? 'text-[#f84e76]' : 'text-[#b0a398] hover:text-[#f84e76]'}`}
                      >
                        <Heart size={16} className={isBookmarked ? 'fill-current' : ''} />
                      </button>
                    )}
                  </div>
                  <h4 className="line-clamp-2 min-h-[36px] font-odii-sans text-sm font-semibold leading-tight tracking-[-0.03em] text-[#211e19]">{story.title}</h4>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#8c7e6c]">
                    <span className="truncate">{story.locationName || '대한민국 문화유산'}</span>
                    <span className="shrink-0 font-mono">{story.formattedDuration || '3:00'}</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
      </div>
    </div>
  );
};
