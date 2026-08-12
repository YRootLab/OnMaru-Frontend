'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Section2StudyStory, getNextStudySelection, getStudyPlaybackLabel } from './studyData';

const IMAGE_FALLBACK = '/images/hanok/hanok-main.png';

export interface StudyVariantProps {
  stories: Section2StudyStory[];
  selectedStoryId: string | null;
  onSelectStory: (storyId: string | null) => void;
}

interface StudySectionFrameProps {
  number: string;
  title: string;
  description: string;
  detail: string;
  children: React.ReactNode;
}

export function StudySectionFrame({
  number,
  title,
  description,
  detail,
  children,
}: StudySectionFrameProps) {
  const headingId = `section2-study-${number}`;

  return (
    <section aria-labelledby={headingId} className="border-t border-[#211e19]/10 py-14 sm:py-20">
      <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#f84e76]">VARIANT {number}</p>
          <h2 id={headingId} className="mt-2 font-odii-sans text-[clamp(25px,3vw,36px)] font-bold tracking-[-0.045em] text-[#211e19]">
            장면을 골라 듣다
          </h2>
        </div>
        <div className="max-w-sm sm:text-right">
          <p className="font-odii-sans text-base font-bold tracking-[-0.025em] text-[#403930]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#786d5e]">{description}</p>
        </div>
      </div>
      {children}
      <p className="mt-4 max-w-2xl text-[11px] leading-5 text-[#8c7e6c]">{detail}</p>
    </section>
  );
}

export function StudyRail({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-5 [scrollbar-color:rgba(33,30,25,0.22)_transparent] [scrollbar-width:thin] sm:mx-0 sm:px-0">
      <div className={`flex w-max max-w-none items-stretch ${className}`}>{children}</div>
    </div>
  );
}

export function StudyImage({
  story,
  sizes,
  className = '',
}: {
  story: Section2StudyStory;
  sizes: string;
  className?: string;
}) {
  const [src, setSrc] = useState(story.imageSrc);

  return (
    <Image
      src={src}
      alt={`${story.title} 풍경`}
      fill
      sizes={sizes}
      className={`object-cover ${className}`}
      onError={() => setSrc(IMAGE_FALLBACK)}
    />
  );
}

export function StudyPlayControl({
  story,
  selectedStoryId,
  onSelectStory,
  compact = false,
}: {
  story: Section2StudyStory;
  selectedStoryId: string | null;
  onSelectStory: (storyId: string | null) => void;
  compact?: boolean;
}) {
  const isSelected = selectedStoryId === story.id;
  const label = getStudyPlaybackLabel(selectedStoryId, story.id);

  return (
    <button
      type="button"
      onClick={() => onSelectStory(getNextStudySelection(selectedStoryId, story.id))}
      aria-label={`${story.title} ${isSelected ? '재생 멈추기' : '재생하기'}`}
      aria-pressed={isSelected}
      className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#f84e76] font-bold text-white shadow-[0_7px_18px_rgba(248,78,118,0.28)] transition-[width,background-color] hover:bg-[#e33f69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211e19] focus-visible:ring-offset-2 motion-reduce:transition-none ${compact && !isSelected ? 'w-11 text-[10px]' : 'min-w-11 px-3 text-[10px]'}`}
    >
      <span aria-hidden="true" className={isSelected ? 'text-[8px]' : 'translate-x-px text-[9px]'}>{isSelected ? 'Ⅱ' : '▶'}</span>
      {(!compact || isSelected) && <span>{label}</span>}
    </button>
  );
}

export function MotionStudyCard({ children, className }: { children: React.ReactNode; className: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.article>
  );
}
