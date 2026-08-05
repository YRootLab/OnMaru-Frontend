'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiChapterPresentation } from '../types/odiiChapter.types';
import { extractOdiiStoryKeywords } from '../utils/odiiKeywordExtractor';

interface ZIndexStackedSectionProps {
  chapters: OdiiChapterPresentation[];
}

interface ChapterBoardCardProps {
  chapter: OdiiChapterPresentation;
  story: OdiiChapterPresentation['stories'][number];
  index: number;
  isActive: boolean;
  onActivate: () => void;
}

const FALLBACK_ART = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1000&q=82';

const getCardLayout = (index: number): string => {
  if (index === 0) return 'col-span-2 row-span-2 md:col-span-4 md:row-span-3';
  if (index === 1) return 'col-span-1 row-span-1 md:col-span-2 md:row-span-2';
  if (index === 2) return 'col-span-1 row-span-1 md:col-span-3 md:row-span-2';
  if (index === 3) return 'col-span-1 row-span-1 md:col-span-3 md:row-span-2';
  if (index === 4) return 'col-span-1 row-span-1 md:col-span-2 md:row-span-1';
  if (index === 5) return 'col-span-1 row-span-1 md:col-span-3 md:row-span-1';
  if (index === 6) return 'col-span-1 row-span-1 md:col-span-3 md:row-span-1';
  return 'col-span-2 row-span-1 md:col-span-4 md:row-span-1';
};

const ChapterBoardCard: React.FC<ChapterBoardCardProps> = ({ chapter, story, index, isActive, onActivate }) => {
  const shouldReduceMotion = useReducedMotion();
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const displayKeywords = story
    ? extractOdiiStoryKeywords(story, chapter.keywords, chapter.id)
    : chapter.keywords;
  const isCompact = index > 0;
  const cardTitle = isCompact
    ? story.audioTitle || story.title || chapter.title
    : chapter.title;
  const cardDescription = story.audioTitle || story.title || '오디오 해설을 준비하고 있습니다.';
  const cardPadding = isCompact ? 'p-2 sm:p-2.5 md:p-3' : 'p-3.5 sm:p-4 md:p-5';
  const isThisPlaying = Boolean(story && currentStory.stid === story.stid && isPlaying);

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!story) return;
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
      return;
    }
    setCurrentStory(story);
  };

  return (
    <motion.article
      tabIndex={0}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: isActive ? 1 : 0.72, scale: isActive ? 1 : 0.985 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative min-h-0 overflow-hidden rounded-[1.5rem] border border-white/60 bg-[#d8d0c5] shadow-[0_18px_44px_rgba(61,45,29,0.12)] outline-none transition-shadow duration-500 focus-visible:ring-2 focus-visible:ring-[#a94d35]/60 ${getCardLayout(index)}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <img
        src={story?.imageUrl || FALLBACK_ART}
        alt={story?.title || chapter.title}
        className="absolute inset-0 h-full w-full object-cover brightness-[0.72] saturate-[0.72] transition-[filter,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:brightness-[0.8] group-hover:saturate-[0.82] group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-[#211e19]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#171512]/[0.96] via-[#211e19]/[0.44] to-[#211e19]/[0.06]" />

      <div className={`absolute inset-x-0 bottom-0 z-10 max-h-full overflow-hidden text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.3)] ${cardPadding}`}>
        <p className="truncate text-[10px] font-semibold text-white/75 sm:text-[11px]">
          {story.locationName || '한국의 문화 공간'}
        </p>
        <h3 className={`${isCompact ? 'mt-0.5 line-clamp-2 text-sm sm:text-base' : 'mt-1 text-lg sm:text-xl'} font-semibold leading-tight tracking-[-0.04em] text-[#fffaf3]`}>
          {cardTitle}
        </h3>
        {!isCompact && (
          <p className="mt-1 line-clamp-1 text-[11px] text-white/78">
            {cardDescription}
          </p>
        )}
        <div className={`${isCompact ? 'mt-1.5 gap-1' : 'mt-2 gap-1.5'} flex flex-wrap`}>
          {displayKeywords.slice(0, isCompact ? 2 : 4).map((keyword) => (
            <span key={keyword} className="rounded-full border border-white/30 bg-black/25 px-1.5 py-0.5 text-[9px] text-white sm:px-2 sm:text-[10px]">
              #{keyword}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!story}
          aria-label={`${cardTitle} ${isThisPlaying ? '일시정지' : '듣기'}`}
          className={`${isCompact ? 'mt-1.5 h-7 w-7 justify-center px-0 sm:w-auto sm:justify-start sm:px-2.5' : 'mt-2.5 h-8 px-3'} inline-flex items-center gap-1.5 rounded-full bg-white text-[10px] font-bold text-[#211e19] transition-colors duration-500 hover:bg-[#f3e5d8] disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span aria-hidden="true" className="text-[10px]">{isThisPlaying ? 'Ⅱ' : '▶'}</span>
          <span className={isCompact ? 'hidden sm:inline' : undefined}>{isThisPlaying ? '일시정지' : '듣기'}</span>
        </button>
      </div>
    </motion.article>
  );
};

export const ZIndexStackedSection: React.FC<ZIndexStackedSectionProps> = ({
  chapters,
}) => {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);
  const shouldReduceMotion = useReducedMotion();

  const activateChapter = (chapter: OdiiChapterPresentation) => {
    setActiveChapterId(chapter.id);
  };

  if (chapters.length === 0) return null;

  return (
    <section aria-label="네 곳의 공간 큐레이션" className="relative px-4 pb-14 pt-16 sm:px-8 sm:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="max-w-lg text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#211e19] sm:text-3xl">
              네 곳의 공기를 한눈에
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#655b4d]">
              마음이 머무는 장면을 고르면, 그곳의 분위기가 무대 뒤에서 천천히 바뀝니다.
            </p>
          </div>
          <span className="hidden text-xs font-medium text-[#8c7e6c] sm:block">가볍게 둘러보기</span>
        </div>

        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 grid h-[540px] min-h-0 grid-cols-2 grid-rows-6 gap-2.5 md:h-[min(56vh,520px)] md:min-h-[440px] md:grid-cols-12 md:grid-rows-4"
        >
          {chapters.flatMap((chapter) => chapter.stories.slice(0, 2).map((story) => ({ chapter, story }))).map(({ chapter, story }, index) => (
            <ChapterBoardCard
              key={`${chapter.id}-${story.stid}`}
              chapter={chapter}
              story={story}
              index={index}
              isActive={activeChapterId === chapter.id}
              onActivate={() => activateChapter(chapter)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
