'use client';

import React, { useEffect, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { useOdiiAudioPlayer } from '../hooks/useOdiiAudioPlayer';

export const LocalMiniPlayer: React.FC = () => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const skipForward = useOdiiAudioStore((s) => s.skipForward);

  const [isVisible, setIsVisible] = useState(false);

  // 스크롤이 일정 높이 이상 내려가면 미니 플레이어 노출
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-white/95 backdrop-blur-xl border border-[#F8A8C0]/50 rounded-full px-4 py-2.5 shadow-2xl transition-all duration-500 animate-slide-up flex items-center justify-between">
      {/* 썸네일 & 타이틀 */}
      <div className="flex items-center space-x-3 min-w-0 pr-2">
        <img
          src={currentStory.imageUrl}
          alt={currentStory.title}
          className="w-10 h-10 rounded-full object-cover border border-[#D42058]/30 flex-shrink-0 animate-spin-slow"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        />
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#2A1A0A] truncate">
            {currentStory.title}
          </h4>
          <p className="text-[11px] text-[#786050] truncate">
            {currentStory.speaker || '온마루 도슨트'}
          </p>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 bg-[#D42058] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#E03870] transition-colors"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button
          onClick={() => skipForward(30)}
          className="w-8 h-8 text-[#786050] hover:text-[#2A1A0A] text-xs font-bold transition-colors"
          title="30초 건너뛰기"
        >
          30↻
        </button>
      </div>
    </div>
  );
};
