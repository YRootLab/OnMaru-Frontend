'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { useOdiiAudioPlayer } from '../hooks/useOdiiAudioPlayer';

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const HeroAudioPlayer: React.FC = () => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const currentTime = useOdiiAudioStore((s) => s.currentTime);
  const duration = useOdiiAudioStore((s) => s.duration);
  const isBookmarked = useOdiiAudioStore((s) => s.isBookmarked);

  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const skipForward = useOdiiAudioStore((s) => s.skipForward);
  const skipBackward = useOdiiAudioStore((s) => s.skipBackward);
  const toggleBookmark = useOdiiAudioStore((s) => s.toggleBookmark);

  const { seekTo } = useOdiiAudioPlayer();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const remainingSeconds = Math.max(0, duration - currentTime);

  return (
    <div className="bg-[#1C1814] text-white rounded-3xl p-6 sm:p-8 border border-[#3A332C] shadow-2xl flex flex-col justify-between h-full relative overflow-hidden">
      {/* 배경 은은한 노을 미색 무드 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D42058]/10 via-transparent to-transparent pointer-events-none" />

      {/* 상단 앨범 아트 및 배지 */}
      <div className="relative z-10">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-[#24211D] border border-white/10 shadow-lg">
          <img
            src={currentStory.imageUrl}
            alt={currentStory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <span className="px-3 py-1 bg-[#D42058] text-white text-xs font-extrabold rounded-md shadow-md">
              {currentStory.badgeText || '한옥 오디오 가이드'}
            </span>
            <span className="text-white/80 text-xs font-medium backdrop-blur-sm px-2 py-0.5 rounded bg-black/30">
              {currentStory.category}
            </span>
          </div>
        </div>

        {/* 타이틀 및 해설자 */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5 line-clamp-1 font-serif tracking-tight">
          {currentStory.audioTitle || currentStory.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#A09588] mb-6 flex items-center gap-1.5">
          <span>📍 {currentStory.locationName || currentStory.title}</span>
          <span>•</span>
          <span>{currentStory.speaker || '온마루 해설 도슨트'}</span>
        </p>
      </div>

      {/* 타임라인 슬라이더 & 컨트롤 */}
      <div className="relative z-10 space-y-4">
        {/* 프로그레스 슬라이더 */}
        <div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full accent-[#D42058] h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs font-mono text-[#A09588] mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* 컨트롤 버튼 모음 */}
        <div className="flex items-center justify-between pt-2">
          {/* 북마크 버튼 */}
          <button
            onClick={toggleBookmark}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isBookmarked
                ? 'text-[#F8A8C0] bg-[#D42058]/20 border border-[#D42058]/40'
                : 'text-[#A09588] hover:text-white hover:bg-white/5'
            }`}
          >
            {isBookmarked ? '🔖 Saved' : '🔖 Save'}
          </button>

          {/* 메인 컨트롤러 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => skipBackward(10)}
              className="p-2 text-[#A09588] hover:text-white transition-colors font-bold text-sm"
              title="10초 뒤로"
            >
              ↺ 10
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-13 h-13 sm:w-14 sm:h-14 bg-[#D42058] hover:bg-[#E03870] text-white rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 text-xl font-bold"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={() => skipForward(10)}
              className="p-2 text-[#A09588] hover:text-white transition-colors font-bold text-sm"
              title="10초 앞으로"
            >
              10 ↻
            </button>
          </div>

          <div className="text-xs text-[#A09588] font-mono">
            🔊 100%
          </div>
        </div>
      </div>
    </div>
  );
};
