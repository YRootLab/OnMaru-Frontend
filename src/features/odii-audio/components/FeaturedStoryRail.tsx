'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface FeaturedStoryRailProps {
  stories: OdiiStoryItem[];
}

const TABS = ['추천', '한옥', '시장'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80';

function getValidImage(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return FALLBACK_IMAGE;
  }
  return url;
}

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(true);

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
  const visualDirection = direction;

  // 7초(7000ms)마다 자동으로 다음 오디오 스토리로 스위칭
  useEffect(() => {
    if (featured.length < 2 || !isSectionInView) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((index) => (index + 1) % featured.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featured.length, activeTab, autoplayVersion, isSectionInView]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSectionInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (!lead) return null;

  const move = (nextDirection: number) => {
    setDirection(nextDirection);
    setActiveIndex((index) => (index + nextDirection + featured.length) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };

  const play = () => {
    if (currentStory.stid === lead.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(lead);
    }
  };

  const following = featured
    .slice(1, 3)
    .map((_, index) => featured[(activeIndex + index + 1) % featured.length]);

  const leadImageUrl = getValidImage(lead.imageUrl);

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 sm:pb-28">
      <div>
        {/* 상단 섹션 타이틀 및 탭 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-maruburi text-2xl font-semibold tracking-[-0.04em] text-[#211e19]">
              이번 주 소리 추천 Top 7
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setDirection(1);
                  setActiveTab(tab);
                  setActiveIndex(0);
                  setAutoplayVersion((version) => version + 1);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#211e19] text-white'
                    : 'border border-[#211e19]/20 text-[#655b4d] hover:border-[#211e19] hover:text-[#211e19]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 히어로 앰비언트 카드 컨테이너 */}
        <div className="relative min-h-[380px] overflow-hidden rounded-[1.8rem] bg-[#1a1715] shadow-2xl sm:min-h-[440px]">
          
          {/* 🌟 현재 포커싱된 이미지(lead.imageUrl)를 Scale Up + Blur 처리하여 배경에 꽉 채움 */}
          <AnimatePresence initial={false} mode="sync">
            <motion.img
              key={lead.stid}
              src={leadImageUrl}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
              initial={{ opacity: 0, scale: 1.35, x: visualDirection * 28 }}
              animate={{ opacity: 0.7, scale: 1.22, x: 0 }}
              exit={{ opacity: 0, scale: 1.15, x: visualDirection * -28 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover blur-3xl saturate-150 brightness-90"
            />
          </AnimatePresence>

          {/* 에디토리얼 시네마틱 앰비언트 오버레이 (가독성 보장 소프트 그라데이션) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141210]/90 via-[#141210]/70 to-[#141210]/25 backdrop-blur-[2px]" />
          <div className="absolute inset-y-0 left-0 w-2/3 bg-[radial-gradient(ellipse_at_left,rgba(20,18,15,0.5),transparent_70%)]" />

          {/* 내부 콘텐츠 레이어 */}
          <div className="relative z-10 grid min-h-[380px] grid-cols-1 items-stretch p-7 sm:min-h-[440px] sm:grid-cols-12 sm:p-10">
            
            {/* 좌측 텍스트 & 재생 컨트롤 */}
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
                  <span className="inline-block self-start rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-200 backdrop-blur-md border border-white/15">
                    {lead.category} · {lead.locationName}
                  </span>
                  <h2 className="mt-4 font-maruburi text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-6xl">
                    {lead.title}
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-7 text-white/90 drop-shadow">
                    {lead.audioTitle}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
                  <button
                    type="button"
                    onClick={play}
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#211e19] shadow-2xl transition-all hover:scale-[1.03] hover:bg-amber-50 active:scale-95"
                  >
                    <span>{currentStory.stid === lead.stid && isPlaying ? '일시정지' : '이야기 듣기'}</span>
                    <span className="ml-1 text-xs text-[#6c6257]">{lead.formattedDuration}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="mr-1 text-xs font-semibold text-white/80">
                      {activeIndex + 1} / {featured.length}
                    </span>
                    <button
                      type="button"
                      aria-label="이전 추천"
                      onClick={() => move(-1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/30 transition-transform active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                        <path d="m14 19-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="다음 추천"
                      onClick={() => move(1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#211e19] shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                        <path d="m10 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 우측 포커싱된 전면 앨범아트 이미지 1개 + 뒤따르는 다음 스토리 카드 2개 */}
            <div className="absolute bottom-5 right-5 top-5 hidden items-center gap-3 sm:flex">
              {/* 포커싱된 전면 대표 메인 카드 */}
              <AnimatePresence initial={false} mode="popLayout">
                <motion.img
                  key={lead.stid}
                  src={leadImageUrl}
                  alt={lead.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  initial={{ opacity: 0, x: visualDirection * 36, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: visualDirection * -24, scale: 0.97 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="aspect-[3/4] h-[320px] w-[240px] rounded-2xl object-cover shadow-2xl ring-1 ring-white/20"
                />
              </AnimatePresence>

              {/* 다음 추천 스토리 얇은 카드 2개 */}
              <AnimatePresence initial={false} mode="popLayout">
                {following.map((story, index) => {
                  const imgUrl = getValidImage(story.imageUrl);
                  return (
                    <motion.button
                      key={`${lead.stid}-${story.stid}`}
                      type="button"
                      onClick={() => {
                        setDirection(1);
                        setActiveIndex((activeIndex + index + 1) % featured.length);
                        setAutoplayVersion((version) => version + 1);
                      }}
                      initial={{ opacity: 0, x: 18, scale: 0.94 }}
                      animate={{ opacity: 0.65, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -14, scale: 0.96 }}
                      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="h-[285px] w-16 overflow-hidden rounded-2xl transition-all hover:opacity-100 ring-1 ring-white/10"
                    >
                      <img
                        src={imgUrl}
                        alt={story.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="h-full w-full scale-125 object-cover blur-[1px]"
                      />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
