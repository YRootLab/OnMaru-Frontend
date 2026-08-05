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
  const [activeTab, setActiveTab] = useState('추천');
  const [isHovered, setIsHovered] = useState(false);

  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const featured = useMemo(() => {
    if (activeTab === '추천') return stories.slice(0, 10);
    const matched = stories.filter((story) => story.category.includes(activeTab));
    return (matched.length ? matched : stories).slice(0, 10);
  }, [activeTab, stories]);

  // 무한 롤링 루프를 위해 카드 트랙을 3배로 복제
  const infiniteCards = useMemo(() => {
    if (featured.length === 0) return [];
    return [...featured, ...featured, ...featured];
  }, [featured]);

  const activeStory = currentStory.stid
    ? stories.find((s) => s.stid === currentStory.stid) || featured[0]
    : featured[0];

  if (!featured.length || !activeStory) return null;

  const playStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const activeImageUrl = getValidImage(activeStory.imageUrl);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a94d35]">
            Live Odii Stream
          </span>
          <h2 className="font-maruburi text-2xl font-semibold tracking-[-0.04em] text-[#211e19]">
            지금 소리를 따라 흘러가는 오디오 가이드
          </h2>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[#211e19] text-white shadow-md'
                  : 'border border-[#211e19]/20 text-[#655b4d] hover:border-[#211e19] hover:text-[#211e19]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 뤼튼 크랙 스타일 메인 히어로 하이라이트 & 우측 무한 롤링 트랙 컨테이너 */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-[#181614] shadow-2xl transition-all sm:min-h-[480px]"
      >
        {/* 1. 배경 Scale-Up Ambient Blur 오버레이 */}
        <AnimatePresence mode="sync">
          <motion.img
            key={activeStory.stid}
            src={activeImageUrl}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 0.55, scale: 1.18 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 h-full w-full object-cover blur-3xl saturate-150 brightness-90"
          />
        </AnimatePresence>

        {/* 2. 에디토리얼 시네마틱 앰비언트 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#171614] via-[#171614]/85 to-transparent z-10" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_left,rgba(20,18,15,0.7),transparent_80%)] z-10" />

        {/* 3. 메인 콘텐츠 분할 grid (좌: 텍스트 & 컨트롤 / 우: 무한 우측 이동 롤링 카드 트랙) */}
        <div className="relative z-20 grid min-h-[440px] grid-cols-1 items-center p-8 sm:min-h-[480px] sm:grid-cols-12 sm:p-12 gap-8">
          
          {/* 좌측 메인 텍스트 & 컨트롤 */}
          <div className="flex h-full flex-col justify-between sm:col-span-5">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-amber-200 backdrop-blur-md border border-white/15">
                {activeStory.category} · {activeStory.locationName}
              </span>
              <h3 className="mt-4 font-maruburi text-4xl font-bold leading-[1.15] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:text-5xl">
                {activeStory.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/80 line-clamp-3">
                {activeStory.audioTitle}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => playStory(activeStory)}
                className="flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#211e19] shadow-2xl transition-all hover:scale-105 hover:bg-amber-50 active:scale-95"
              >
                <span>{currentStory.stid === activeStory.stid && isPlaying ? '일시정지' : '이야기 재생하기'}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#211e19] text-xs text-white">
                  {currentStory.stid === activeStory.stid && isPlaying ? '❚❚' : '▶'}
                </span>
              </button>
              <span className="text-xs font-semibold text-white/60">
                {activeStory.formattedDuration}
              </span>
            </div>
          </div>

          {/* 우측 뤼튼 크랙 스타일: 우측으로 계속 스무스하게 흐르는 무한 루프 슬라이드 트랙 (Rightward Continuous Marquee Track) */}
          <div className="sm:col-span-7 relative w-full overflow-hidden py-4">
            
            {/* 트랙 좌우 페이드 그라데이션 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#171614]/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#171614]/90 to-transparent" />

            {/* 무한 롤링 트랙 (Rightward Flowing Track) */}
            <motion.div
              className="flex gap-5 w-max"
              animate={{
                x: ['-50%', '0%'], // 오른쪽 방향으로 스무스하게 무한 이동
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: isHovered ? 45 : 25, // 마우스 호버 시 일시정지감(슬로우다운)
                  ease: 'linear',
                },
              }}
            >
              {infiniteCards.map((story, idx) => {
                const isSelected = activeStory.stid === story.stid;
                const imgUrl = getValidImage(story.imageUrl);

                return (
                  <div
                    key={`${story.stid}-${idx}`}
                    onClick={() => setCurrentStory(story)}
                    className={`group relative h-[310px] w-[210px] shrink-0 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 ring-amber-300 scale-105 shadow-2xl z-20'
                        : 'opacity-75 hover:opacity-100 hover:scale-102 hover:shadow-xl'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={story.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* 카드 비주얼 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* 카드 하단 텍스트 및 정보 */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                        {story.category}
                      </span>
                      <h4 className="font-maruburi text-base font-bold text-white line-clamp-1 mt-0.5">
                        {story.title}
                      </h4>
                      <p className="text-xs text-white/70 line-clamp-1 mt-1 font-light">
                        {story.audioTitle}
                      </p>
                    </div>

                    {/* 재생 상태 표시 파동 또는 태그 */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-[#171614] shadow-md">
                        <span>NOW</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
