'use client';

import React, { useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface ZTranslateCardStageProps {
  featuredStories: OdiiStoryItem[];
}

export const ZTranslateCardStage: React.FC<ZTranslateCardStageProps> = ({ featuredStories }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const displayStories = featuredStories.slice(0, 3);

  const handleCardClick = (story: OdiiStoryItem, idx: number) => {
    setActiveIdx(idx);
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <section className="w-full py-16 relative overflow-hidden bg-gradient-to-b from-[#141210] via-[#1A1815] to-[#141210] text-white rounded-3xl border border-[#3A332C] shadow-2xl my-8">
      {/* 배경 3D 빛/입자 그라데이션 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#D42058]/15 via-[#F5A623]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 헤더 */}
      <div className="text-center relative z-20 mb-8 px-4">
        <span className="text-[11px] font-extrabold tracking-widest text-[#F8A8C0] uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-block mb-3">
          SHOPIFY EDITIONS INSPIRED • 3D STAGE
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-odii-sans text-white">
          3차원 Z-축 공간으로 만나는 오디 큐레이션
        </h2>
        <p className="text-xs sm:text-sm text-[#A09588] mt-2 max-w-md mx-auto">
          카드를 터치하면 오디오가 재생되며, 이미 재생 중인 카드를 다시 터치하면 일시정지됩니다.
        </p>
      </div>

      {/* 3D Scene Wrapper (preview.html perspective) */}
      <div className="relative z-20 w-full min-h-[440px] flex items-center justify-center [perspective:1200px]">
        {/* 3D Floating Stack */}
        <div className="relative w-[300px] sm:w-[360px] h-[380px] sm:h-[420px] [transform-style:preserve-3d] animate-float-3d">
          {displayStories.map((story, idx) => {
            const isActive = activeIdx === idx;
            const isThisPlaying = currentStory.stid === story.stid && isPlaying;
            
            let zTrans = -300 + idx * 120;
            let rotY = idx === 0 ? -12 : idx === 2 ? 12 : 0;
            let transX = idx === 0 ? -50 : idx === 2 ? 50 : 0;

            if (isActive) {
              zTrans = 80;
              rotY = 0;
              transX = 0;
            }

            return (
              <div
                key={story.stid}
                onClick={() => handleCardClick(story, idx)}
                style={{
                  transform: `translateZ(${zTrans}px) rotateY(${rotY}deg) translateX(${transX}px)`,
                  zIndex: isActive ? 40 : 10 + idx,
                }}
                className={`absolute inset-0 rounded-3xl p-6 flex flex-col justify-between transition-all duration-700 cursor-pointer backdrop-blur-xl border border-white/15 group shadow-2xl ${
                  isActive
                    ? 'bg-gradient-to-b from-[#2A231D]/95 to-[#1A1512]/95 ring-2 ring-[#D42058]/80 shadow-[#D42058]/20'
                    : 'bg-[#1C1814]/85 hover:border-white/40 opacity-80 hover:opacity-100'
                }`}
              >
                {/* 카드 상단 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#D42058] text-white">
                    {story.category}
                  </span>
                  <span className="text-xs text-white/60 font-mono">
                    {story.distance || '300m'}
                  </span>
                </div>

                {/* 중앙 썸네일 */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden my-3 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 justify-between">
                    <div className="flex items-center space-x-2">
                      {/* SVG 재생/정지 버튼 */}
                      <div className="w-8 h-8 rounded-full bg-[#D42058] flex items-center justify-center shadow-lg">
                        {isThisPlaying ? (
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {isThisPlaying ? '일시정지' : '오디오 재생'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 하단 텍스트 정보 */}
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1 font-odii-sans group-hover:text-[#F8A8C0] transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-[#A09588] truncate mt-1">
                    {story.audioTitle} • ⏱ {story.formattedDuration}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
