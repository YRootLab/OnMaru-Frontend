'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  IoHeart,
  IoHeartOutline,
  IoPlay,
  IoPause,
  IoMusicalNotesOutline,
} from 'react-icons/io5';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface Props {
  stories: OdiiStoryItem[];
  onBookmarkStory?: (story: OdiiStoryItem) => void;
  bookmarkedIds?: Set<string>;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
];

const imageFor = (story: OdiiStoryItem, index: number) => {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
};

const categoryFor = (story: OdiiStoryItem) => {
  const labels: Record<string, string> = { 한옥: '한옥/고택', 시장: '전통시장', 마을: '전통마을', 궁: '궁궐/역사', 길: '자연/둘레길' };
  return labels[story.category] || (story.category !== '오디 이야기' ? story.category : '문화유산');
};

export const OdiiOriginalStoryList: React.FC<Props> = ({ stories, onBookmarkStory, bookmarkedIds }) => {
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const selectStory = useOdiiAudioStore((state) => state.selectStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const play = (story: OdiiStoryItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <div className="w-full py-3">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-[#211e19]/5">
        {stories.map((story, index) => {
          const current = currentStory.stid === story.stid;
          const playing = current && isPlaying;
          const saved = bookmarkedIds?.has(story.stid);
          return (
            <motion.div
              key={story.stid}
              layout
              onClick={() => selectStory(story)}
              className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-3 transition-all duration-300 ${current ? 'bg-[#fff0f5]  ' : 'hover:bg-[#fff8fa]'}`}
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className={`flex w-6 shrink-0 items-center justify-center font-mono text-[11px] font-semibold ${current ? 'text-[#f84e76]' : 'text-[#8c7e6c]'}`}>
                  {playing ? <IoMusicalNotesOutline size={13} className="animate-pulse text-[#f84e76]" /> : String(index + 1).padStart(2, '0')}
                </span>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#e8e0d5]  sm:h-[52px] sm:w-[52px]">
                  <img src={imageFor(story, index)} alt={story.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGES[0]; }} />
                  {playing && <span className="absolute inset-0 flex items-center justify-center bg-[#f84e76]/80 text-[8px] font-bold tracking-widest text-white">PLAY</span>}
                </div>
                <div className="min-w-0 pr-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-[10px]">
                    <span className="shrink-0 font-bold text-[#f84e76]">{categoryFor(story)}</span>
                    <span className="truncate text-[#8c7e6c]">· {story.locationName || '대한민국 문화유산'}</span>
                  </div>
                  <h4 className={`truncate font-odii-sans text-xs font-semibold sm:text-sm ${current ? 'text-[#f84e76]' : 'text-[#211e19] group-hover:text-[#f84e76]'}`}>{story.title}</h4>
                  <p className="truncate text-[11px] text-[#786d5e]">{story.audioTitle}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {onBookmarkStory && (
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); onBookmarkStory(story); }}
                    aria-label={saved ? '마음에서 삭제' : '마음에 담기'}
                    className={`transition-transform hover:scale-110 ${saved ? 'text-[#f84e76]' : 'text-[#b1a396] hover:text-[#f84e76]'}`}
                  >
                    {saved ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                  </button>
                )}
                <span className="hidden font-mono text-[11px] text-[#8c7e6c] sm:inline-block">{story.formattedDuration || '3:00'}</span>
                <button
                  type="button"
                  onClick={(event) => play(story, event)}
                  aria-label={playing ? '일시정지' : '재생'}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${playing ? 'scale-105 bg-[#f84e76] text-white' : ' bg-white text-[#f84e76] hover: hover:bg-[#f84e76] hover:text-white'}`}
                >
                  {playing ? <IoPause size={13} /> : <IoPlay size={13} className="ml-0.5" />}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
