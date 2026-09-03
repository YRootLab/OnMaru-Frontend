'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface Props { stories: OdiiStoryItem[]; storySets?: Record<string, OdiiStoryItem[]>; }

const FALLBACK_IMAGES = ['/images/hanok/hanok-main.png', '/images/hanok/hanok-exterior.png', '/images/hanok/hanok-interior.png', '/images/hanok/hanok-porch.png', '/images/hanok/giwa-detail.png'];
const imageFor = (story: OdiiStoryItem, index: number) => story.imageUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
const categoryFor = (story: OdiiStoryItem) => story.category !== '오디 이야기' ? story.category : story.badgeText || '오디오 가이드';
const durationFor = (story: OdiiStoryItem) => story.formattedDuration || '오디오';

export const OdiiSection2Experiments: React.FC<Props> = ({ stories, storySets }) => {
  const reduceMotion = useReducedMotion();
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useMemo(() => {
    const source = storySets?.['추천']?.length ? storySets['추천'] : stories;
    return source.filter((story, index, list) => list.findIndex((item) => item.stid === story.stid) === index).slice(0, 5);
  }, [stories, storySets]);

  useEffect(() => {
    if (reduceMotion || items.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % items.length), 6500);
    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  if (!items.length) return null;
  const play = (story: OdiiStoryItem) => currentStory.stid === story.stid ? setIsPlaying(!isPlaying) : setCurrentStory(story);

  return (
    <section aria-labelledby="section-2-experiments-heading" className="mx-auto w-full max-w-[1080px] px-4 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-12">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-[#f84e76]">SECTION 2 · UI STUDY</p>
          <h2 id="section-2-experiments-heading" className="font-odii-sans text-2xl font-bold tracking-[-0.045em] text-[#211e19] sm:text-3xl">같은 장면, 다른 정리 방식</h2>
          <p className="mt-2 text-xs leading-5 text-[#786d5e]">기존 포스터 레일의 리듬을 유지하면서, 카드 안 정보의 호흡만 다르게 설계한 시안입니다.</p>
        </div>
        <span className="hidden shrink-0 rounded-full  bg-white/60 px-3 py-1.5 text-[10px] text-[#8c7e6c] sm:inline-flex">임시 테스트</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: .65, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden rounded-[26px]  bg-white/45 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#f84e76]">IMPROVEMENT 01</p><h3 className="mt-1 text-lg font-bold tracking-[-0.04em]">포스터 포커스</h3></div><span className="text-[10px] text-[#8c7e6c]">중앙 집중형</span></div>
          <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[20px] bg-[#f2ede6] px-3 py-8 sm:min-h-[480px]">
            {items.slice(0, 3).map((story, index) => {
              const offset = index - (activeIndex % 3);
              const active = offset === 0;
              return <motion.button key={story.stid} type="button" onClick={() => active ? play(story) : setActiveIndex(index)} animate={{ opacity: active ? 1 : .45, x: offset * 54, y: active ? 0 : offset % 2 ? 9 : -6, scale: active ? 1 : .87, rotate: active ? 0 : offset % 2 ? 2 : -2 }} transition={{ duration: .55, ease: [0.16, 1, 0.3, 1] }} className={`absolute top-1/2 w-[min(58vw,218px)] -translate-y-1/2 overflow-hidden rounded-[3px] bg-white text-left ${active ? 'z-20  ' : 'z-10  '}`} aria-label={story.title}>
                <div className="relative aspect-[.68/1] overflow-hidden"><img src={imageFor(story, index)} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]; }} /><span className="absolute left-3 top-3 text-[10px] font-semibold text-white drop-shadow">{String(index + 1).padStart(2, '0')}</span>{active && <span className="absolute right-3 top-3 rounded-full bg-[#fffdf9]/90 px-2 py-1 text-[9px] font-semibold text-[#f84e76]">{categoryFor(story)}</span>}</div>
                <div className="min-h-[118px] bg-[#fffdf9] px-3.5 py-3.5 sm:min-h-[130px] sm:px-4"><p className="truncate text-[9px] text-[#8c7e6c]">{story.locationName || '대한민국 문화유산'}</p><h4 className="mt-1 line-clamp-2 text-base font-bold leading-[1.35] tracking-[-.04em]">{story.title}</h4><div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-[10px] text-[#786d5e]">{story.audioTitle}</span><span className="shrink-0 text-[10px] font-semibold text-[#f84e76]">{durationFor(story)}</span></div></div>
              </motion.button>;
            })}
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">{items.slice(0, 3).map((story, index) => <button key={story.stid} type="button" onClick={() => setActiveIndex(index)} aria-label={`${index + 1}번째 장면`} className={`h-1 rounded-full transition-all ${index === activeIndex % 3 ? 'w-7 bg-[#f84e76]' : 'w-1.5 bg-[#211e19]/20'}`} />)}</div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: .65, delay: .1, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden rounded-[26px]  bg-[#f7f4ee]/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#f84e76]">IMPROVEMENT 02</p><h3 className="mt-1 text-lg font-bold tracking-[-0.04em]">정보 분리 포스터</h3></div><span className="text-[10px] text-[#8c7e6c]">읽기 우선형</span></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">{items.slice(0, 4).map((story, index) => <motion.button key={story.stid} type="button" onClick={() => play(story)} whileHover={reduceMotion ? undefined : { y: -5 }} className="group relative text-left"><div className="relative aspect-[.72/1] overflow-hidden rounded-[3px] bg-white "><img src={imageFor(story, index + 1)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length]; }} /><span className="absolute left-3 top-3 rounded-full bg-[#fffdf9]/90 px-2 py-1 text-[9px] font-semibold text-[#f84e76] backdrop-blur-sm">{categoryFor(story)}</span></div><div className="relative mx-2 -mt-4 rounded-[14px] bg-[#fffdf9]/95 p-3.5  backdrop-blur-sm sm:p-4"><p className="truncate text-[9px] text-[#8c7e6c]">{story.locationName || '대한민국 문화유산'}</p><h4 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-[1.35] tracking-[-.035em]">{story.title}</h4><div className="mt-2 flex items-center justify-between   pt-2 text-[9px] text-[#8c7e6c]"><span className="truncate">{story.audioTitle}</span><span className="shrink-0 font-semibold text-[#f84e76]">{durationFor(story)}</span></div>{currentStory.stid === story.stid && <span className="absolute -right-1.5 -top-2 rounded-full bg-[#f84e76] px-2 py-1 text-[9px] font-bold text-white">{isPlaying ? '재생 중' : '선택됨'}</span>}</div></motion.button>)}</div>
        </motion.section>
      </div>
    </section>
  );
};
