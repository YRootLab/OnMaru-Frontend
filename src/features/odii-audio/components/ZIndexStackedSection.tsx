'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

const CHAPTERS = [
  { eyebrow: '바람이 머무는 곳', title: '처마 아래, 바람은 잠시 쉬어 갑니다.', description: '마루를 지나온 공기와 풍경 소리가 한옥의 하루를 엽니다.', image: '/images/hanok/hanok-main.png', color: '#d8e2d3', ink: '#20312a' },
  { eyebrow: '사람의 온기가 흐르는 곳', title: '말 한마디와 익숙한 소리가 시장을 채웁니다.', description: '골목의 발걸음과 가게의 인사, 한 끼를 나누는 사람들의 이야기.', image: '/images/hanok/hanok-interior.png', color: '#f1d5a8', ink: '#3e2c1a' },
  { eyebrow: '시간이 겹쳐진 곳', title: '오래된 길에는 아직 들리지 않은 이야기가 있습니다.', description: '기와 위의 빗소리와 담장 사이의 발걸음이 시간을 지금으로 데려옵니다.', image: '/images/hanok/hanok-exterior.png', color: '#c9bfd9', ink: '#30233c' },
];

interface ZIndexStackedSectionProps { stories: OdiiStoryItem[]; }

export const ZIndexStackedSection: React.FC<ZIndexStackedSectionProps> = ({ stories }) => {
  const [selected, setSelected] = useState(0);
  const wheelLocked = useRef(false);
  const wheelDelta = useRef(0);
  const isStackHovered = useRef(false);
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const changeChapter = (direction: number) => setSelected((current) => (current + direction + CHAPTERS.length) % CHAPTERS.length);
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isStackHovered.current) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (wheelLocked.current) return;
      wheelDelta.current += event.deltaY;
      if (Math.abs(wheelDelta.current) < 18) return;
      wheelLocked.current = true;
      changeChapter(wheelDelta.current > 0 ? 1 : -1);
      wheelDelta.current = 0;
      window.setTimeout(() => { wheelLocked.current = false; }, 650);
    };
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);
  const play = (story?: OdiiStoryItem) => {
    if (!story) return;
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <section className="bg-[#f7f4ee] px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <h2 className="font-maruburi text-4xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-5xl">공간이 품은 소리를, 이야기로 만나보세요.</h2>
          <p className="mt-6 max-w-sm text-sm leading-6 text-[#655b4d]">카드 위에서 휠을 움직이면 세 장면이 끝없이 겹쳐지며 전환됩니다.</p>
          <div className="mt-8 flex gap-2">
            {CHAPTERS.map((chapter, index) => <button key={chapter.eyebrow} type="button" onClick={() => setSelected(index)} aria-label={chapter.eyebrow} className={`h-2.5 rounded-full transition-all ${index === selected ? 'w-9 bg-[#a94d35]' : 'w-2.5 bg-[#c9bdad]'}`} />)}
          </div>
        </div>

        <div
          onMouseEnter={() => { isStackHovered.current = true; }}
          onMouseLeave={() => { isStackHovered.current = false; }}
          className="relative h-[322px] w-[70%] justify-self-center cursor-ns-resize overscroll-contain lg:col-span-8 sm:h-[413px]"
        >
          {CHAPTERS.map((chapter, index) => {
            const depth = (index - selected + CHAPTERS.length) % CHAPTERS.length;
            const story = stories[index];
            const isFront = depth === 0;
            return (
              <article
                key={chapter.eyebrow}
                onClick={() => setSelected(index)}
                className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-[2rem] shadow-[0_28px_70px_rgba(64,46,30,0.18)] transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] sm:rounded-[2.75rem]"
                style={{ backgroundColor: chapter.color, color: chapter.ink, zIndex: CHAPTERS.length - depth, transform: `translateY(${depth * 32}px) scale(${1 - depth * 0.055})`, opacity: depth === 2 ? 0.72 : 1 }}
              >
                <img src={chapter.image} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-65" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/25 to-transparent" />
                <div className="relative flex h-full max-w-[78%] flex-col justify-end p-5 sm:max-w-[66%] sm:p-8">
                  <p className="text-[10px] font-bold tracking-[0.14em] opacity-65 sm:text-[11px]">0{index + 1} / {chapter.eyebrow}</p>
                  <h3 className="mt-2 font-maruburi text-2xl font-semibold leading-[1.12] tracking-[-0.045em] sm:text-4xl">{chapter.title}</h3>
                  <p className="mt-3 max-w-sm text-xs leading-5 opacity-75 sm:text-sm sm:leading-6">{chapter.description}</p>
                  {isFront && story && <button type="button" onClick={(event) => { event.stopPropagation(); play(story); }} className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#211e19] px-3 py-2.5 text-xs font-semibold text-white sm:px-4 sm:text-sm"><span>{currentStory.stid === story.stid && isPlaying ? 'Ⅱ' : '▶'}</span>{story.title} 듣기</button>}
                </div>
                <span className="absolute bottom-[-5rem] right-5 font-maruburi text-[14rem] leading-none tracking-[-0.14em] opacity-10 sm:right-12 sm:text-[20rem]">0{index + 1}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
