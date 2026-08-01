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
    <div className="bg-[#1C1814] text-white rounded-3xl p-6 sm:p-8 border border-[#3A332C] shadow-2xl flex flex-col justify-between h-full min-h-[440px]">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-[#3A332C] pb-4 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-[#F8A8C0] tracking-wider uppercase">
            Narrative Script
          </span>
          <span className="text-white/30">•</span>
          <span className="text-sm font-bold font-serif text-white">실시간 오디오 대본</span>
        </div>
        {isPlaying && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#D42058] text-white animate-pulse shadow-md">
            ● LIVE SCRIPT
          </span>
        )}
      </div>

      {/* 대본 라인 스크롤 영역 (tacky left border 제거, 고품격 활성 텍스트 발광) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 max-h-[340px] sm:max-h-[400px]"
      >
        {parsedScriptLines.map((line, idx) => {
          const isActive = idx === activeScriptIndex;

          return (
            <p
              key={line.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => handleLineClick(line.timeSec)}
              className={`p-3.5 rounded-2xl text-sm sm:text-base transition-all duration-300 cursor-pointer font-serif leading-relaxed ${
                isActive
                  ? 'bg-white/10 text-white font-bold border border-[#D42058]/50 shadow-lg scale-[1.01]'
                  : 'text-[#A09588] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xs font-mono text-[#D42058] mr-2">
                [{Math.floor(line.timeSec / 60)}:
                {(line.timeSec % 60).toString().padStart(2, '0')}]
              </span>
              {line.text}
            </p>
          );
        })}
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between border-t border-[#3A332C] pt-4 mt-4 text-xs text-[#A09588]">
        <span className="font-mono text-[#F8A8C0]">
          {parsedScriptLines.length > 0
            ? `${activeScriptIndex + 1} / ${parsedScriptLines.length} 줄`
            : '0 / 0 줄'}
        </span>
        <span className="text-[#A09588] hover:text-white transition-colors cursor-pointer">
          대본 라인을 터치하여 구간 이동
        </span>
      </div>
    </div>
  );
};
