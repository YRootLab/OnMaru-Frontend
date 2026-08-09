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
      {/* 배경 은은한 무드 */}
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
              <h1 className="mb-1.5 line-clamp-1 font-odii-sans text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {currentStory.audioTitle || currentStory.title}
        </h1>
        <p className="mb-6 text-xs leading-5 text-[#A09588] sm:text-sm">
          <span className="block">{currentStory.locationName || currentStory.title}</span>
          <span className="mt-0.5 block">{currentStory.speaker || '온마루 해설 도슨트'}</span>
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

        {/* 컨트롤 버튼 모음 (SVG 아이콘 및 정갈한 라벨 적용) */}
        <div className="flex items-center justify-between pt-2">
          {/* 북마크 버튼 */}
          <button
            onClick={toggleBookmark}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              isBookmarked
                ? 'text-[#F8A8C0] bg-[#D42058]/20 border border-[#D42058]/40'
                : 'text-[#A09588] hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>{isBookmarked ? '저장됨' : '북마크'}</span>
          </button>

          {/* 메인 컨트롤러 (10초 이전 / SVG 재생-일시정지 / 10초 다음) */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => skipBackward(10)}
              className="p-2 text-[#A09588] hover:text-white transition-colors font-bold text-xs flex items-center space-x-1"
              title="10초 뒤로"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
              </svg>
              <span>10s</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-3 bg-[#D42058] hover:bg-[#E03870] text-white rounded-full flex items-center space-x-2 shadow-xl transition-all active:scale-95 text-xs font-bold"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>재생하기</span>
                </>
              )}
            </button>

            <button
              onClick={() => skipForward(10)}
              className="p-2 text-[#A09588] hover:text-white transition-colors font-bold text-xs flex items-center space-x-1"
              title="10초 앞으로"
            >
              <span>10s</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M11.5 8c2.65 0 5.05.99 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z"/>
              </svg>
            </button>
          </div>

          <div className="text-xs text-[#A09588] font-mono flex items-center space-x-1">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
