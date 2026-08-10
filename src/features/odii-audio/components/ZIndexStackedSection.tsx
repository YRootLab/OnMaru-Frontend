'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiChapterPresentation } from '../types/odiiChapter.types';

interface ZIndexStackedSectionProps {
  chapters: OdiiChapterPresentation[];
}

export const ZIndexStackedSection: React.FC<ZIndexStackedSectionProps> = ({ chapters }) => {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || 'hanok');
  const shouldReduceMotion = useReducedMotion();

  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const activeChapter = chapters.find((chap) => chap.id === activeChapterId) || chapters[0];

  if (!activeChapter) return null;

  const handlePlayStory = (story: any) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const heroImage = activeChapter.heroImageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1600&q=85';

  return (
    <section aria-label="장면별 이야길 깊이 들여다보기" className="relative w-full py-8 sm:py-12">
      <div className="w-full">
        {/* 인위적 요약 뱃지 전면 제거 — 순수 타이포그래피 헤더 */}
        <div className="flex flex-col gap-1 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold leading-tight tracking-[-0.04em] text-transparent">
              소리와 장면으로 만나는 한국의 온기
            </h2>
          </div>
          <p className="text-xs text-[#786d5e]">
            각 챕터를 선택해 깊은 이야기 속으로 들어가보세요.
          </p>
        </div>

        {/* 챕터 가로 칩 */}
        <div className="mb-4 flex items-center space-x-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chapters.map((chap) => {
            const isActive = chap.id === activeChapter.id;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => setActiveChapterId(chap.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-[#211e19] text-white shadow-sm font-bold'
                    : 'bg-[#f7f4ee] text-[#655b4d] hover:bg-[#ede5d8] hover:text-[#211e19]'
                }`}
              >
                <span>{chap.title}</span>
              </button>
            );
          })}
        </div>

        {/* 정갈하고 절제된 에디토리얼 카드 (이미지 과다 제거, 텍스트 집중) */}
        <div className="relative min-h-[360px] w-full overflow-hidden rounded-3xl border border-[#211e19]/10 bg-[#fbf8f2] shadow-[0_8px_24px_rgba(33,30,25,0.04)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter.id}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 items-stretch md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px]"
            >
              {/* 좌측 텍스트 내러티브 & 트랙 */}
              <div className="flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <h3 className="font-odii-sans text-2xl font-bold tracking-tight text-[#211e19] sm:text-3xl">
                    {activeChapter.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold text-[#a94d35]">
                    {activeChapter.subTitle}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#655b4d] sm:text-sm sm:leading-relaxed">
                    “{activeChapter.narrative}”
                  </p>
                </div>

                {/* 하단 대표 트랙 2개 */}
                <div className="mt-6 border-t border-[#211e19]/10 pt-4">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {activeChapter.stories.slice(0, 2).map((story) => {
                      const isCurrent = currentStory.stid === story.stid;
                      const isThisPlaying = isCurrent && isPlaying;
                      return (
                        <div
                          key={story.stid}
                          onClick={() => handlePlayStory(story)}
                          className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                            isCurrent
                              ? 'border-[#a94d35] bg-[#f4ebe1] shadow-xs'
                              : 'border-[#211e19]/10 bg-white hover:border-[#a94d35]/50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[9px] font-bold text-[#a94d35]">
                              {story.locationName || '소리 공간'}
                            </span>
                            <h4 className="mt-0.5 truncate font-odii-sans text-xs font-bold text-[#211e19]">
                              {story.title}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayStory(story);
                            }}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                              isThisPlaying
                                ? 'bg-[#a94d35] text-white shadow-xs'
                                : 'bg-[#211e19] text-white hover:bg-[#a94d35]'
                            }`}
                          >
                            {isThisPlaying ? (
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                              <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 우측 절제된 단일 액자 비주얼 */}
              <div className="relative min-h-[220px] overflow-hidden rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none">
                <img
                  src={heroImage}
                  alt={activeChapter.title}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};


