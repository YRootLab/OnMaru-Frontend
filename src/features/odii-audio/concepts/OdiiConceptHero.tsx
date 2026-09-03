'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import type { OdiiConcept } from './odiiConcept';
import { ODII_CONCEPT_COPY } from './odiiConceptCopy';

const FALLBACK_IMAGE = '/images/hanok/hanok-main.png';

interface OdiiConceptHeroProps {
  concept: OdiiConcept;
  story: OdiiStoryItem;
  isPlaying: boolean;
  onPlay: () => void;
}

export function OdiiConceptHero({ concept, story, isPlaying, onPlay }: OdiiConceptHeroProps) {
  const reduceMotion = useReducedMotion();
  const copy = ODII_CONCEPT_COPY[concept];
  const image = story.imageUrl || FALLBACK_IMAGE;
  const button = (
    <button type="button" onClick={onPlay} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76]">
      {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      {isPlaying ? '잠시 멈추기' : '이야기 듣기'}
    </button>
  );

  if (concept === 'studio') {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.8 }} className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-8 sm:pt-10">
        <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[#1D1D1F] sm:min-h-[620px]">
          <Image src={image} alt={story.title} fill unoptimized sizes="(max-width: 768px) 100vw, 1152px" className="object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F] via-[#1D1D1F]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-7 p-7 text-white sm:flex-row sm:items-end sm:justify-between sm:p-12">
            <div className="max-w-3xl">
              <h1 className="font-odii-sans text-[clamp(42px,7vw,82px)] font-semibold leading-[0.98] tracking-[-0.065em]">{copy.thesis}</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/72 sm:text-base">{copy.support}</p>
            </div>
            <div className="shrink-0">{button}</div>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }} className="mx-auto grid w-full max-w-6xl items-center gap-9 px-4 pb-12 pt-12 sm:px-8 lg:grid-cols-[minmax(0,.92fr)_minmax(420px,1.08fr)] lg:gap-16 lg:pb-20 lg:pt-20">
      <div className={concept === 'hanji' ? 'relative z-10 lg:translate-x-8' : ''}>
        <h1 className={`${concept === 'hanji' ? 'font-maruburi font-semibold' : 'font-odii-sans font-semibold'} text-[clamp(42px,6vw,76px)] leading-[1.04] tracking-[-0.065em] text-[#1D1D1F]`}>{copy.thesis}</h1>
        <p className="mt-6 max-w-lg text-sm leading-6 text-[#746F68] sm:text-base">{copy.support}</p>
        <div className="mt-8 flex items-center gap-4">{button}<span className="hidden max-w-[180px] truncate text-xs text-[#746F68] sm:block">{story.locationName || story.title}</span></div>
      </div>
      <div className={`relative ${concept === 'hanji' ? 'p-4 sm:p-7' : ''}`}>
        {concept === 'hanji' ? <div className="absolute inset-0 rotate-[-1.5deg] bg-white shadow-[0_30px_90px_rgba(29,29,31,.10)]" /> : null}
        <div className={`relative overflow-hidden ${concept === 'hanji' ? 'aspect-[4/3] rounded-[2px]' : 'aspect-[4/3] rounded-[34px] shadow-[0_32px_100px_rgba(29,29,31,.12)]'}`}>
          <Image src={image} alt={story.title} fill unoptimized sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F]/65 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs text-white/70">{story.locationName || '대한민국 문화유산'}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{story.title}</h2>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
