'use client';

import React from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface EditorialStoryListProps {
  stories: OdiiStoryItem[];
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
    한옥: '한옥/고택', 시장: '전통시장', 마을: '전통마을', 궁: '궁궐/역사', 길: '자연/둘레길',
  };
  if (story.category && story.category !== '오디 이야기') return categoryLabels[story.category] || story.category;
  if (story.title.includes('한옥') || story.title.includes('고택')) return '한옥/고택';
  if (story.title.includes('시장')) return '전통시장';
  if (story.title.includes('궁') || story.title.includes('왕')) return '궁궐/역사';
  return story.badgeText === '음원 제공' ? '문화유산' : '';
};

export const EditorialStoryListSkeleton: React.FC = () => (
  <div aria-label="트랙 목록 로딩 중" className="w-full py-2" aria-busy="true">
    {Array.from({ length: 7 }, (_, index) => (
      <div key={index} className="flex items-center gap-3 border-b border-[#211e19]/[0.08] px-1 py-3.5 sm:gap-4 sm:py-4">
        <div className="odii-skeleton h-3 w-5 rounded bg-[#e5e5e3]" />
        <div className="odii-skeleton h-16 w-[76px] shrink-0 rounded-[10px] bg-[#d9d9d7] sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2"><div className="odii-skeleton h-2.5 w-20 rounded bg-[#e5e5e3]" /><div className="odii-skeleton h-4 w-48 rounded bg-[#cdcdca] sm:w-72" /><div className="odii-skeleton h-2.5 w-32 rounded bg-[#e5e5e3]" /></div>
        <div className="odii-skeleton h-8 w-8 shrink-0 rounded-full bg-[#e5e5e3]" />
      </div>
    ))}
  </div>
);

const listVariants: Variants = {
  hidden: { opacity: 0, y: 5, filter: 'blur(2px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.025 } },
  exit: { opacity: 0, y: -3, filter: 'blur(2px)', transition: { duration: 0.14 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

export const EditorialStoryList: React.FC<EditorialStoryListProps> = ({ stories }) => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const selectStory = useOdiiAudioStore((s) => s.selectStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);

  const handlePlayClick = (story: OdiiStoryItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  if (stories.length === 0) {
    return <div className="w-full py-16 text-center text-[#655b4d]"><p className="text-xs font-medium">선택한 조건에 해당하는 오디오 가이드가 없습니다.</p></div>;
  }

  return (
    <div className="w-full py-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${selectedCategory}-${searchQuery}`} variants={listVariants} initial="hidden" animate="visible" exit="exit" className="divide-y divide-[#211e19]/[0.08]">
          {stories.map((story, index) => {
            const isCurrent = currentStory.stid === story.stid;
            const isThisPlaying = isCurrent && isPlaying;
            const trackNum = String(index + 1).padStart(2, '0');

            return (
              <motion.div
                key={`${story.stid}-${index}`}
                variants={itemVariants}
                onClick={() => selectStory(story)}
                className={`group relative grid cursor-pointer grid-cols-[24px_76px_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3.5 transition-colors duration-300 sm:grid-cols-[30px_80px_minmax(0,1fr)_auto] sm:gap-4 sm:py-4 ${isCurrent ? 'bg-[#fff8fa]' : 'hover:bg-[#faf8f4]'}`}
              >
                <div className="text-center">
                  {isThisPlaying ? <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-[#f84e76]" /> : <span className={`font-mono text-[11px] font-semibold ${isCurrent ? 'text-[#f84e76]' : 'text-[#a09282]'}`}>{trackNum}</span>}
                </div>

                <div className="relative h-16 w-[76px] shrink-0 overflow-hidden rounded-[10px] bg-[#f3eee8] sm:w-20">
                  <img src={imageFor(story, index)} alt={story.title} loading="lazy" decoding="async" className="h-full w-full scale-[1.12] object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = LIST_FALLBACK_IMAGES[0]; }} />
                  {!story.imageUrl && <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1 py-0.5 text-[8px] font-medium text-white/90">참고용</span>}
                  {isThisPlaying && <div className="absolute inset-0 grid place-items-center bg-[#211e19]/45"><span className="h-2 w-2 rounded-full bg-[#f84e76]" /></div>}
                </div>

                <div className="min-w-0 pr-1">
                  <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[#8c7e6c]">{categoryLabelFor(story) && <><span className="shrink-0 font-medium text-[#f84e76]">{categoryLabelFor(story)}</span><span className="text-[#d1c9bf]">·</span></>}<span className="truncate">{story.locationName || '대한민국 문화유산'}</span></div>
                  <h4 className={`truncate font-odii-sans text-[15px] font-bold tracking-[-0.025em] sm:text-base ${isCurrent ? 'text-[#f84e76]' : 'text-[#211e19]'}`}>{story.title}</h4>
                  <p className="mt-1 truncate text-[11px] text-[#786d5e]">{story.audioTitle || story.locationName || '대한민국 문화유산'}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
                  <span className="hidden text-xs font-medium text-[#8c7e6c] sm:inline-block">{story.formattedDuration || '3:00'}</span>
                  <button type="button" onClick={(event) => handlePlayClick(story, event)} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200 ${isThisPlaying ? 'border-[#f84e76] bg-[#f84e76] text-white' : 'border-[#211e19]/15 bg-transparent text-[#655b4d] hover:border-[#f84e76] hover:text-[#f84e76]'}`} title={isThisPlaying ? '일시정지' : '재생'}>
                    {isThisPlaying ? <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
