'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface FeaturedStoryRailProps { stories: OdiiStoryItem[]; }
const TABS = ['추천', '한옥', '시장', '궁궐', '자연', '골목'];

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories }) => {
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const featured = useMemo(() => {
    if (activeTab === '추천') return stories;
    const matched = stories.filter((story) => story.category.includes(activeTab));
    return matched.length ? matched : stories;
  }, [activeTab, stories]);
  const lead = featured[activeIndex] ?? featured[0];

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % featured.length), 5000);
    return () => window.clearInterval(timer);
  }, [featured.length, activeTab]);

  if (!lead) return null;
  const move = (direction: number) => setActiveIndex((index) => (index + direction + featured.length) % featured.length);
  const play = () => currentStory.stid === lead.stid ? setIsPlaying(!isPlaying) : setCurrentStory(lead);
  const following = featured.slice(1, 3).map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 sm:pb-28">
      <div className="rounded-[2rem] bg-[#171614] p-4 text-white sm:rounded-[2.5rem] sm:p-5">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setActiveIndex(0); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${activeTab === tab ? 'bg-[#ff6048] text-white' : 'border border-white/20 text-white/65 hover:border-white/50 hover:text-white'}`}>{tab}</button>)}
        </div>

        <div className="relative min-h-[370px] overflow-hidden rounded-[1.5rem] bg-[#292725] sm:min-h-[430px]">
          <img key={lead.stid} src={lead.imageUrl} alt="" className="absolute inset-0 h-full w-full scale-[1.38] object-cover opacity-45 blur-3xl saturate-125 transition-all duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171614] via-[#171614]/92 to-[#171614]/35" />
          <div className="absolute inset-y-0 left-0 w-2/3 bg-[radial-gradient(ellipse_at_left,rgba(0,0,0,0.35),transparent_68%)]" />
          <div className="relative z-10 grid min-h-[370px] grid-cols-1 items-center p-7 sm:min-h-[430px] sm:grid-cols-12 sm:p-10">
            <div className="max-w-xl sm:col-span-7">
              <span className="rounded-full bg-[#ff6048] px-2.5 py-1 text-[11px] font-semibold">소리 추천</span>
              <p className="mt-6 text-xs text-white/50">{lead.category} · {lead.locationName}</p>
              <h2 className="mt-3 font-serif text-4xl leading-[1.05] tracking-[-0.05em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.7)] sm:text-6xl">{lead.title}</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/75">{lead.audioTitle}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button type="button" onClick={play} className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#211e19] transition-transform hover:-translate-y-0.5">{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'} <span className="ml-2 text-[#6c6257]">{lead.formattedDuration}</span></button>
                <div className="flex items-center gap-2">
                  <span className="mr-1 text-xs text-white/60">{activeIndex + 1} / {featured.length}</span>
                  <button type="button" aria-label="이전 추천" onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-colors hover:bg-white hover:text-black">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m14 5-7 7 7 7" /></svg>
                  </button>
                  <button type="button" aria-label="다음 추천" onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#211e19] shadow-lg transition-transform hover:scale-105">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="m10 5 7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute bottom-5 right-5 top-5 hidden items-center gap-3 sm:flex">
              <img key={lead.stid} src={lead.imageUrl} alt={lead.title} className="aspect-[3/4] h-[310px] w-[230px] rounded-2xl object-cover shadow-2xl transition-all duration-700" />
              {following.map((story, index) => <button key={story.stid} type="button" onClick={() => setActiveIndex((activeIndex + index + 1) % featured.length)} className="h-[280px] w-16 overflow-hidden rounded-2xl opacity-50 transition-opacity hover:opacity-90"><img src={story.imageUrl} alt={story.title} className="h-full w-full scale-125 object-cover blur-[2px]" /></button>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
