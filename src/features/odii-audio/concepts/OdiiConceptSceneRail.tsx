'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import type { OdiiConcept } from './odiiConcept';
import { getVisibleSceneIndices } from './sceneRailModel';

const FALLBACKS = ['/images/hanok/hanok-main.png', '/images/hanok/hanok-exterior.png', '/images/hanok/hanok-interior.png'];

export function OdiiConceptSceneRail({ concept, stories, storySets }: { concept: OdiiConcept; stories: OdiiStoryItem[]; storySets?: Record<string, OdiiStoryItem[]> }) {
  const reduceMotion = useReducedMotion();
  const [keyword, setKeyword] = useState(ODII_THEME_CATEGORIES[0].keyword);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const featured = useMemo(() => {
    const category = ODII_THEME_CATEGORIES.find((item) => item.keyword === keyword);
    const categorized = category ? storySets?.[category.label] : undefined;
    const filtered = categorized?.length ? categorized : stories.filter((story) => `${story.category} ${story.title} ${story.locationName || ''}`.includes(keyword));
    const source = filtered.length ? filtered : storySets?.['추천']?.length ? storySets['추천'] : stories;
    return source.slice(0, 7);
  }, [keyword, stories, storySets]);

  if (!featured.length) return null;
  const indices = getVisibleSceneIndices(featured.length, activeIndex);
  const visible = [indices.previous, indices.active, indices.next];
  const activeStory = featured[indices.active];
  const playingActive = currentStory.stid === activeStory.stid && isPlaying;
  const play = () => playingActive ? setIsPlaying(false) : setCurrentStory(activeStory);

  return (
    <section aria-label="주제별 추천 장면" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pb-16 pt-3 sm:pb-24">
      <nav aria-label="장면 카테고리" className="mx-auto mb-8 max-w-6xl overflow-x-auto px-4 [scrollbar-width:none] sm:px-8">
        <div className="flex min-w-max gap-5">
          {ODII_THEME_CATEGORIES.map((item) => {
            const selected = item.keyword === keyword;
            const label = item.keyword === '시장' ? '전통시장' : item.keyword === '마을' ? '전통마을' : item.keyword === '궁' ? '궁궐' : item.keyword === '길' ? '자연' : item.keyword;
            return <button key={item.id} type="button" aria-pressed={selected} onClick={() => { setKeyword(item.keyword); setActiveIndex(0); }} className={`min-h-10 whitespace-nowrap text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76] ${selected ? 'font-semibold text-[#F84E76]' : 'text-[#746F68] hover:text-[#1D1D1F]'}`}>#{label}</button>;
          })}
        </div>
      </nav>

      <div className={`relative mx-auto flex h-[460px] w-full max-w-[1180px] items-center justify-center gap-3 px-0 sm:h-[560px] sm:gap-7 ${concept === 'studio' ? 'rounded-[38px] bg-[#1D1D1F] py-8 shadow-[0_32px_100px_rgba(29,29,31,.16)]' : ''}`}>
        {visible.map((storyIndex, position) => {
          const story = featured[storyIndex];
          const active = position === 1;
          const image = story.imageUrl || FALLBACKS[storyIndex % FALLBACKS.length];
          return (
            <motion.button
              key={`${story.stid}-${position}`}
              type="button"
              onClick={() => active ? play() : setActiveIndex(storyIndex)}
              animate={{ opacity: active ? 1 : concept === 'studio' ? 0.45 : 0.58, scale: active ? 1 : 0.86, y: active ? 0 : 12 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative shrink-0 overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76] ${active ? 'z-20 h-[420px] w-[min(74vw,310px)] sm:h-[520px] sm:w-[360px]' : 'z-10 h-[350px] w-[min(48vw,230px)] sm:h-[440px] sm:w-[270px]'} ${concept === 'hanji' ? 'rounded-[2px] bg-white p-3 shadow-[0_24px_70px_rgba(29,29,31,.11)]' : concept === 'studio' ? 'rounded-[24px] bg-[#1D1D1F]' : 'rounded-[30px] bg-white shadow-[0_24px_80px_rgba(29,29,31,.12)]'}`}
              aria-label={`${story.title}${active ? ', 선택됨. 눌러서 재생' : ', 가운데로 이동'}`}
            >
              <div className={`relative overflow-hidden ${concept === 'hanji' ? 'h-[72%]' : 'h-full'}`}>
                <Image src={image} alt="" fill unoptimized sizes={active ? '360px' : '270px'} className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                {concept !== 'hanji' ? <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F]/85 via-transparent to-transparent" /> : null}
              </div>
              <div className={`${concept === 'hanji' ? 'px-2 pb-2 pt-4 text-[#1D1D1F]' : 'absolute inset-x-0 bottom-0 p-6 text-white sm:p-7'}`}>
                <p className={`text-xs ${concept === 'hanji' ? 'text-[#746F68]' : 'text-white/65'}`}>{story.locationName || story.category}</p>
                <h3 className={`${concept === 'hanji' ? 'font-maruburi' : 'font-odii-sans'} mt-1 line-clamp-2 text-xl font-semibold leading-tight tracking-[-0.04em] sm:text-2xl`}>{story.title}</h3>
                {active ? <span className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold ${concept === 'hanji' ? 'text-[#F84E76]' : 'text-white'}`}>{playingActive ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}{playingActive ? '재생 중' : '이야기 듣기'}</span> : null}
                {active && concept === 'studio' && playingActive ? <span aria-hidden="true" className="ml-4 inline-flex h-4 items-end gap-0.5">{[6, 13, 9, 15, 7].map((height, index) => <motion.i key={index} animate={{ height: [4, height, 5] }} transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.08 }} className="w-0.5 bg-[#FFB36B]" />)}</span> : null}
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-5 flex justify-center gap-2">
        {featured.map((story, index) => <button key={`${story.stid}-dot`} type="button" onClick={() => setActiveIndex(index)} aria-label={`${index + 1}번째 장면`} className={`h-1.5 rounded-full transition-all ${index === indices.active ? 'w-8 bg-[#F84E76]' : 'w-1.5 bg-[#1D1D1F]/15'}`} />)}
      </div>
    </section>
  );
}
