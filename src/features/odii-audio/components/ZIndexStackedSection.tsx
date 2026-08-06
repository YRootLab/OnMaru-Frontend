'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiChapterPresentation } from '../types/odiiChapter.types';

interface ZIndexStackedSectionProps {
  chapters: OdiiChapterPresentation[];
}

interface ChapterTrackRowProps {
  chapter: OdiiChapterPresentation;
  story: OdiiChapterPresentation['stories'][number];
  index: number;
}

function getScriptPreview(story: ChapterTrackRowProps['story']): string {
  const parsedPreview = story.parsedScript?.[0]?.text?.trim();
  if (parsedPreview) return parsedPreview;

  const scriptPreview = story.script
    ?.replace(/\s+/g, ' ')
    .trim()
    .slice(0, 92);
  return scriptPreview || story.audioTitle || '오디오 해설을 준비하고 있습니다.';
}

const ChapterTrackRow: React.FC<ChapterTrackRowProps> = ({ chapter, story, index }) => {
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const isCurrent = currentStory.stid === story.stid;
  const isThisPlaying = isCurrent && isPlaying;

  const selectStory = () => {
    if (isCurrent) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={selectStory}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectStory();
        }
      }}
      className={`group grid cursor-pointer grid-cols-[30px_minmax(0,1fr)_auto] gap-3 px-3 py-3.5 outline-none transition-colors sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 ${
        isCurrent
          ? 'bg-[#f4ebe1]'
          : 'hover:bg-[#f8f4ed] focus-visible:bg-[#f8f4ed]'
      }`}
      aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
    >
      <div className="flex items-start justify-center pt-0.5">
        {isThisPlaying ? (
          <span className="flex h-5 items-end gap-0.5" aria-label="재생 중">
            <span className="h-3 w-0.5 animate-[bounce_0.6s_infinite_100ms] rounded-full bg-[#a94d35]" />
            <span className="h-4 w-0.5 animate-[bounce_0.6s_infinite_300ms] rounded-full bg-[#a94d35]" />
            <span className="h-2 w-0.5 animate-[bounce_0.6s_infinite_200ms] rounded-full bg-[#a94d35]" />
          </span>
        ) : (
          <span className={`font-mono text-[11px] font-semibold ${isCurrent ? 'text-[#a94d35]' : 'text-[#a99d8d]'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-bold text-[#a94d35]">{chapter.keyword}</span>
          <span className="truncate text-[10px] text-[#8c7e6c]">{story.locationName || '대한민국 문화 공간'}</span>
        </div>
        <h3 className={`mt-0.5 truncate font-odii-sans text-sm font-semibold tracking-[-0.025em] sm:text-[15px] ${isCurrent ? 'text-[#a94d35]' : 'text-[#211e19]'}`}>
          {story.title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-[#655b4d]">{story.audioTitle}</p>
        <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-[#8c7e6c] sm:max-w-[620px]">
          “{getScriptPreview(story)}”
        </p>
      </div>

      <div className="flex items-start gap-2 pt-0.5 sm:gap-3">
        <span className="hidden pt-1 font-mono text-[10px] text-[#8c7e6c] sm:block">
          {story.formattedDuration || '오디오'}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            selectStory();
          }}
          aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '듣기'}`}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            isThisPlaying
              ? 'bg-[#a94d35] text-white'
              : 'border border-[#211e19]/15 bg-white text-[#211e19] hover:border-[#211e19] hover:bg-[#211e19] hover:text-white'
          }`}
        >
          {isThisPlaying ? (
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14h4v14h-4V5z" /></svg>
          ) : (
            <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>
    </article>
  );
};

export const ZIndexStackedSection: React.FC<ZIndexStackedSectionProps> = ({ chapters }) => {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);
  const shouldReduceMotion = useReducedMotion();
  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];

  if (!activeChapter) return null;

  return (
    <section aria-label="장면별 오디오 트랙" className="relative w-full pb-14 pt-8 sm:pt-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="flex items-end justify-between gap-6 pb-1">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#a94d35]">장면별 오디오</p>
            <h2 className="mt-1 inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-2xl font-bold leading-tight tracking-[-0.04em] text-transparent sm:text-3xl">
              장면을 고르고, 이어서 들어보세요
            </h2>
          </div>
          <span className="hidden text-xs text-[#8c7e6c] sm:block">{chapters.length}개의 장면 · {activeChapter.stories.length}개의 트랙</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)] md:gap-8">
          <nav aria-label="장면 목록" className="flex gap-1.5 overflow-x-auto pb-1 md:block md:space-y-1.5 md:overflow-visible">
            {chapters.map((chapter, index) => {
              const isActive = activeChapter.id === chapter.id;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveChapterId(chapter.id)}
                  className={`min-w-[148px] rounded-xl border px-3 py-2.5 text-left transition-colors md:w-full ${
                    isActive
                      ? 'border-[#a94d35]/35 bg-[#f4ebe1]'
                      : 'border-transparent bg-transparent hover:border-[#211e19]/10 hover:bg-[#f8f4ed]'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${isActive ? 'text-[#a94d35]' : 'text-[#a99d8d]'}`}>
                    0{index + 1}
                  </span>
                  <span className={`mt-0.5 block truncate text-xs font-bold ${isActive ? 'text-[#211e19]' : 'text-[#655b4d]'}`}>
                    {chapter.title}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-[#8c7e6c]">
                    {chapter.stories.length}개 트랙
                  </span>
                </button>
              );
            })}
          </nav>

          <motion.div
            key={activeChapter.id}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#211e19]/10 bg-[#fbf8f2] shadow-[0_12px_32px_rgba(61,45,29,0.06)]"
          >
            <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#211e19]/10 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#a94d35]">{activeChapter.keywords.join(' · ')}</p>
                <h3 className="mt-1 truncate font-odii-sans text-lg font-bold tracking-[-0.035em] text-[#211e19]">
                  {activeChapter.title}
                </h3>
                <p className="mt-1 text-xs text-[#655b4d]">{activeChapter.narrative}</p>
              </div>
              <span className="text-[10px] text-[#8c7e6c]">대본 미리보기 포함</span>
            </header>

            {activeChapter.stories.length > 0 ? (
              <div className="divide-y divide-[#211e19]/8">
                {activeChapter.stories.map((story, index) => (
                  <ChapterTrackRow key={story.stid} chapter={activeChapter} story={story} index={index} />
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-xs text-[#8c7e6c]">이 장면의 오디오를 준비하고 있습니다.</p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
