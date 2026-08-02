'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface FeaturedStoryRailProps { stories: OdiiStoryItem[]; }
const TABS = ['추천', '한옥', '시장'];

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories }) => {
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const featured = useMemo(() => {
    if (activeTab === '추천') return stories.slice(0, 7);
    const matched = stories.filter((story) => story.category.includes(activeTab));
    return (matched.length ? matched : stories).slice(0, 7);
  }, [activeTab, stories]);
  const lead = featured[activeIndex] ?? featured[0];
  // 좌/우 버튼의 방향을 그대로 전환 애니메이션에 반영한다.
  const visualDirection = direction;

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((index) => (index + 1) % featured.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [featured.length, activeTab, autoplayVersion]);

  if (!lead) return null;
  const move = (nextDirection: number) => {
    setDirection(nextDirection);
    setActiveIndex((index) => (index + nextDirection + featured.length) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };
  const play = () => currentStory.stid === lead.stid ? setIsPlaying(!isPlaying) : setCurrentStory(lead);
  const following = featured.slice(1, 3).map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 sm:pb-28">
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-maruburi text-2xl font-semibold tracking-[-0.04em] text-[#211e19]">이번 주 소리 추천 Top 7</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => <button key={tab} type="button" onClick={() => { setDirection(1); setActiveTab(tab); setActiveIndex(0); setAutoplayVersion((version) => version + 1); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${activeTab === tab ? 'bg-[#211e19] text-white' : 'border border-[#211e19]/20 text-[#655b4d] hover:border-[#211e19] hover:text-[#211e19]'}`}>{tab}</button>)}
          </div>
        </div>

        <div className="relative min-h-[370px] overflow-hidden rounded-[1.5rem] bg-[#292725] sm:min-h-[430px]">
          <AnimatePresence initial={false} mode="sync">
            <motion.img
              key={lead.stid}
              src={lead.imageUrl}
              alt=""
              initial={{ opacity: 0, scale: 1.5, x: visualDirection * 28 }}
              animate={{ opacity: 0.45, scale: 1.38, x: 0 }}
              exit={{ opacity: 0, scale: 1.28, x: visualDirection * -28 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover blur-3xl saturate-125"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-[#171614] via-[#171614]/92 to-[#171614]/35" />
          <div className="absolute inset-y-0 left-0 w-2/3 bg-[radial-gradient(ellipse_at_left,rgba(0,0,0,0.35),transparent_68%)]" />
          <div className="relative z-10 grid min-h-[370px] grid-cols-1 items-stretch p-7 sm:min-h-[430px] sm:grid-cols-12 sm:p-10">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={lead.stid}
                initial={{ opacity: 0, x: visualDirection * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: visualDirection * -12 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full max-w-xl flex-col sm:col-span-7"
              >
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-xs font-medium tracking-[0.12em] text-white/55">{lead.category} · {lead.locationName}</p>
                <h2 className="mt-3 font-maruburi text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.7)] sm:text-6xl">{lead.title}</h2>
                <p className="mt-4 max-w-md text-base leading-7 text-white/75">{lead.audioTitle}</p>
              </div>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-7">
                <button type="button" onClick={play} className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#211e19] transition-transform hover:-translate-y-0.5">{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'} <span className="ml-2 text-[#6c6257]">{lead.formattedDuration}</span></button>
                <div className="flex items-center gap-2">
                  <span className="mr-1 text-xs text-white/60">{activeIndex + 1} / {featured.length}</span>
                  <button type="button" aria-label="다음 추천" onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#211e19] shadow-lg transition-transform hover:scale-105">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m10 5 7 7-7 7" /></svg>
                  </button>
                </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-5 right-5 top-5 hidden items-center gap-3 sm:flex">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.img
                  key={lead.stid}
                  src={lead.imageUrl}
                  alt={lead.title}
                  initial={{ opacity: 0, x: visualDirection * 36, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: visualDirection * -24, scale: 0.97 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="aspect-[3/4] h-[310px] w-[230px] rounded-2xl object-cover shadow-2xl"
                />
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout">
                {following.map((story, index) => (
                  <motion.button
                    key={`${lead.stid}-${story.stid}`}
                    type="button"
                    onClick={() => { setDirection(1); setActiveIndex((activeIndex + index + 1) % featured.length); setAutoplayVersion((version) => version + 1); }}
                    initial={{ opacity: 0, x: 18, scale: 0.94 }}
                    animate={{ opacity: 0.5, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -14, scale: 0.96 }}
                    transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="h-[280px] w-16 overflow-hidden rounded-2xl hover:opacity-90"
                  >
                    <img src={story.imageUrl} alt={story.title} className="h-full w-full scale-125 object-cover blur-[2px]" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
