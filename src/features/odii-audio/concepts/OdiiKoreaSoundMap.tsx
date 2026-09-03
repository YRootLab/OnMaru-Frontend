'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import type { OdiiConcept } from './odiiConcept';
import { KOREA_REGIONS, matchStoriesToRegion } from './koreaRegions';

export function OdiiKoreaSoundMap({ concept, stories }: { concept: OdiiConcept; stories: OdiiStoryItem[] }) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(KOREA_REGIONS[0].id);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const region = KOREA_REGIONS.find((item) => item.id === selectedId) ?? KOREA_REGIONS[0];
  const matches = useMemo(() => matchStoriesToRegion(stories, region), [region, stories]);
  const lead = matches[0];
  const playingLead = Boolean(lead && currentStory.stid === lead.stid && isPlaying);
  const dark = concept === 'studio';
  const select = (id: typeof selectedId) => setSelectedId(id);
  const play = () => {
    if (!lead) return;
    if (playingLead) setIsPlaying(false);
    else setCurrentStory(lead);
  };

  return (
    <section aria-labelledby="korea-sound-map-heading" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <h2 id="korea-sound-map-heading" className="font-odii-sans text-[clamp(30px,4vw,48px)] font-semibold tracking-[-0.055em] text-[#1D1D1F]">소리로 만나는 우리나라</h2>
      <div className={`mt-8 grid overflow-hidden rounded-[36px] border border-black/[0.04] shadow-[0_28px_90px_rgba(29,29,31,.08)] lg:grid-cols-[1.05fr_.95fr] ${dark ? 'bg-[#1D1D1F] text-white' : 'bg-white/80'}`}>
        <div className={`relative min-h-[560px] overflow-hidden p-5 sm:p-10 ${concept === 'hanji' ? 'bg-[radial-gradient(circle_at_50%_30%,rgba(255,179,107,.11),transparent_55%)]' : dark ? 'bg-[#1D1D1F]' : 'bg-[radial-gradient(circle_at_50%_35%,rgba(64,104,90,.09),transparent_55%)]'}`}>
          <svg viewBox="0 0 360 550" role="group" aria-label="대한민국 권역 선택 지도" className="mx-auto h-[500px] w-full max-w-[390px] overflow-visible">
            {KOREA_REGIONS.map((item) => {
              const active = item.id === selectedId;
              return (
                <g key={item.id}>
                  <motion.path
                    d={item.path}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.label} 선택`}
                    aria-pressed={active}
                    onClick={() => select(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        select(item.id);
                      }
                    }}
                    animate={{ fill: active ? (concept === 'hanji' ? '#F84E76' : concept === 'studio' ? '#FFB36B' : '#40685A') : dark ? '#2d2d2f' : '#FAFAF8' }}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                    stroke={dark ? '#FAFAF8' : '#1D1D1F'}
                    strokeOpacity={active ? 0.75 : 0.18}
                    strokeWidth={active ? 2 : 1.2}
                    className="cursor-pointer outline-none focus-visible:stroke-[#F84E76] focus-visible:stroke-[3]"
                  />
                  <text x={item.labelX} y={item.labelY} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none fill-current text-[11px] font-semibold" fill={active ? (dark ? '#1D1D1F' : '#FAFAF8') : dark ? '#FAFAF8' : '#746F68'}>{item.shortLabel}</text>
                  {active && concept === 'sori' && !reduceMotion ? <motion.circle cx={item.labelX} cy={item.labelY} r="8" fill="none" stroke="#FFB36B" initial={{ r: 7, opacity: 0.8 }} animate={{ r: 34, opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} /> : null}
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-x-5 bottom-5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] sm:inset-x-10">
            {KOREA_REGIONS.map((item) => <button key={item.id} type="button" onClick={() => select(item.id)} aria-pressed={item.id === selectedId} className={`min-h-10 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F84E76] ${item.id === selectedId ? 'bg-[#F84E76] text-white' : dark ? 'bg-white/10 text-white/65 hover:bg-white/15' : 'bg-[#FAFAF8] text-[#746F68] hover:text-[#1D1D1F]'}`}>{item.shortLabel}</button>)}
          </div>
        </div>

        <aside aria-live="polite" className={`flex min-h-[420px] flex-col justify-between p-7 sm:p-10 ${dark ? 'border-t border-white/10 lg:border-l lg:border-t-0' : 'border-t border-black/[0.05] lg:border-l lg:border-t-0'}`}>
          <div>
            <p className={`text-sm ${dark ? 'text-white/55' : 'text-[#746F68]'}`}>{region.label}</p>
            <h3 className={`mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl ${dark ? 'text-white' : 'text-[#1D1D1F]'}`}>{matches.length ? `${matches.length}개의 이야기` : '곧 들려드릴게요'}</h3>
          </div>
          {lead ? (
            <div>
              <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[24px]">
                <Image src={lead.imageUrl || '/images/hanok/hanok-main.png'} alt="" fill unoptimized sizes="(max-width: 1024px) 100vw, 460px" className="object-cover" />
              </div>
              <p className={`text-xs ${dark ? 'text-white/55' : 'text-[#746F68]'}`}>{lead.locationName || region.label}</p>
              <h4 className={`mt-1 line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.04em] ${dark ? 'text-white' : 'text-[#1D1D1F]'}`}>{lead.title}</h4>
              <button type="button" onClick={play} className={`mt-6 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76] ${dark ? 'bg-white text-[#1D1D1F]' : 'bg-[#1D1D1F] text-white'}`}>{playingLead ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}{playingLead ? '잠시 멈추기' : `${region.shortLabel} 이야기 듣기`}</button>
            </div>
          ) : (
            <div>
              <p className={`max-w-sm text-sm leading-6 ${dark ? 'text-white/60' : 'text-[#746F68]'}`}>이 지역의 오디 이야기는 준비 중입니다. 다른 지역을 고르거나 전체 아카이브를 둘러보세요.</p>
              <button type="button" onClick={() => document.getElementById('odii-archive')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })} className={`mt-5 text-sm font-semibold underline underline-offset-4 ${dark ? 'text-[#FFB36B]' : 'text-[#F84E76]'}`}>전체 이야기 보기</button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
