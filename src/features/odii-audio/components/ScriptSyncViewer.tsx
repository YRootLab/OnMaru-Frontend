'use client';

import React, { useEffect, useRef } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { useOdiiAudioPlayer } from '../hooks/useOdiiAudioPlayer';

export const ScriptSyncViewer: React.FC = () => {
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const activeScriptIndex = useOdiiAudioStore((s) => s.activeScriptIndex);
  const parsedScriptLines = useOdiiAudioStore((s) => s.parsedScriptLines);
  const { seekTo } = useOdiiAudioPlayer();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLParagraphElement | null>(null);

  // 활성 줄 스크롤 중앙 자동 정렬
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeScriptIndex]);

  const handleLineClick = (timeSec: number) => {
    seekTo(timeSec);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EAE0D0] shadow-sm flex flex-col justify-between h-full min-h-[420px]">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#786050]">Narrative Script</span>
          <span className="text-[#D8C8B0]">•</span>
          <span className="text-sm font-bold text-[#2A1A0A]">스크립트</span>
        </div>
        {isPlaying && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D42058] text-white animate-pulse">
            ● LIVE
          </span>
        )}
      </div>

      {/* 대본 라인 스크롤 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#F8A8C0] max-h-[340px] sm:max-h-[400px]"
      >
        {parsedScriptLines.map((line, idx) => {
          const isActive = idx === activeScriptIndex;

          return (
            <p
              key={line.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => handleLineClick(line.timeSec)}
              className={`p-3 rounded-xl text-sm sm:text-base transition-all duration-300 cursor-pointer font-medium leading-relaxed ${
                isActive
                  ? 'bg-[#FFF0F4] text-[#D42058] font-bold border-l-4 border-[#D42058] shadow-sm scale-[1.01]'
                  : 'text-[#786050] hover:bg-[#FAF6F0] hover:text-[#2A1A0A]'
              }`}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* 하단 줄 번호 & 팁 */}
      <div className="flex items-center justify-between border-t border-[#EAE0D0] pt-4 mt-4 text-xs text-[#786050]">
        <span className="font-semibold text-[#D42058]">
          {parsedScriptLines.length > 0
            ? `${activeScriptIndex + 1} / ${parsedScriptLines.length} 줄`
            : '0 / 0 줄'}
        </span>
        <span className="text-[#D42058] hover:underline cursor-pointer">
          줄을 클릭하면 해당 구간으로 이동합니다
        </span>
      </div>
    </div>
  );
};
