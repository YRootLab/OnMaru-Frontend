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
    <div className="bg-[#FFF0F4] rounded-3xl p-5 sm:p-7 border border-[#F8A8C0]/40 shadow-sm flex flex-col justify-between h-full">
      {/* 상단 앨범 아트 및 배지 */}
      <div>
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-[#F5EFE6] shadow-md">
          <img
            src={currentStory.imageUrl}
            alt={currentStory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <span className="px-3 py-1 bg-[#D42058] text-white text-xs font-bold rounded-md">
              {currentStory.badgeText || 'EP.04 Narrative Audio'}
            </span>
            <span className="text-white/80 text-xs">{currentStory.category}</span>
          </div>
        </div>

        {/* 타이틀 및 해설자 */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#2A1A0A] mb-1 line-clamp-1">
          {currentStory.audioTitle || currentStory.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#786050] mb-4">
          {currentStory.speaker || '온마루 해설 도슨트'} • {currentStory.locationName || currentStory.title}
        </p>
      </div>

      {/* 타임라인 슬라이더 & 컨트롤 */}
      <div>
        {/* 슬라이더 */}
        <div className="mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full accent-[#D42058] h-1.5 bg-[#F8A8C0]/50 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs font-medium text-[#786050] mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* 컨트롤 버튼 모음 */}
        <div className="flex items-center justify-between pt-2">
          {/* 북마크 버튼 */}
          <button
            onClick={toggleBookmark}
            className={`p-2.5 rounded-full transition-colors ${
              isBookmarked ? 'text-[#D42058] bg-[#D42058]/10' : 'text-[#786050] hover:bg-black/5'
            }`}
            title="북마크"
          >
            🔖 <span className="text-xs font-medium ml-1">bookmark</span>
          </button>

          {/* 메인 컨트롤러 (10초 이전 / 재생-일시정지 / 10초 다음) */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => skipBackward(10)}
              className="p-2 text-[#2A1A0A] hover:text-[#D42058] transition-colors font-bold text-sm sm:text-base"
              title="10초 뒤로"
            >
              ↺ 10
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#D42058] hover:bg-[#E03870] text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 text-lg"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={() => skipForward(10)}
              className="p-2 text-[#2A1A0A] hover:text-[#D42058] transition-colors font-bold text-sm sm:text-base"
              title="10초 앞으로"
            >
              10 ↻
            </button>
          </div>

          {/* 볼륨 / 공유 아이콘 */}
          <div className="flex items-center space-x-1 text-[#786050] text-sm">
            <span title="음량">🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};
