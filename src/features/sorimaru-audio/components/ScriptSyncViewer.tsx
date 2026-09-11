'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const ScriptSyncViewer: React.FC = () => {
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const activeScriptIndex = useSorimaruAudioStore((s) => s.activeScriptIndex);
  const parsedScriptLines = useSorimaruAudioStore((s) => s.parsedScriptLines);
  const { seekTo } = useSorimaruAudioPlayer();
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const activeItemRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (isTranscriptOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeScriptIndex, isTranscriptOpen]);

  if (!parsedScriptLines.length) return null;

  const previewStart = Math.max(0, Math.min(activeScriptIndex, parsedScriptLines.length - 3));
  const previewLines = parsedScriptLines.slice(previewStart, previewStart + 3);

  return (
    <>
      <section className="rounded-3xl  bg-[#fbf8f2] p-6  sm:p-8">
        <div className="flex items-start justify-between gap-4   pb-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#a94d35]">NARRATIVE SCRIPT</p>
            <h3 className="mt-1 font-sorimaru-sans text-lg font-semibold tracking-[-0.03em]">듣고 있는 이야기</h3>
          </div>
          {isPlaying && <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#a94d35] px-2.5 py-1 text-[10px] font-bold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />재생 중</span>}
        </div>

        <blockquote className="mt-6 border-l-2  pl-4 font-sorimaru-sans text-[15px] leading-7 text-[#3c342a] sm:text-base">
          {previewLines.map((line, index) => (
            <p key={line.id} className={line.id === parsedScriptLines[activeScriptIndex]?.id ? 'font-semibold text-[#211e19]' : index === 0 ? '' : 'mt-2'}>
              {line.text}
            </p>
          ))}
        </blockquote>

        <div className="mt-6 flex items-center justify-between   pt-4">
          <span className="text-xs text-[#786d5e]">
            <span>{formatTime(parsedScriptLines[activeScriptIndex]?.timeSec ?? 0)}</span>
            <span className="ml-2">대본 {parsedScriptLines.length}개 구간</span>
          </span>
          <button type="button" onClick={() => setIsTranscriptOpen(true)} className="text-sm font-semibold text-[#a94d35] underline decoration-[#a94d35]/40 underline-offset-4 transition hover:text-[#7f3725]">
            대본 전체 보기 →
          </button>
        </div>
      </section>

      {isTranscriptOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-[#211e19]/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="오디오 대본 전체 보기">
          <div className="flex max-h-[86vh] w-full max-w-2xl flex-col rounded-t-3xl bg-[#fbf8f2]  sm:rounded-3xl">
            <div className="flex items-center justify-between   px-6 py-5 sm:px-8">
              <div><p className="text-[11px] font-bold tracking-[0.16em] text-[#a94d35]">FULL TRANSCRIPT</p><h3 className="mt-1 font-sorimaru-sans text-xl font-semibold">오디오 대본</h3></div>
              <button type="button" onClick={() => setIsTranscriptOpen(false)} className="rounded-full p-2 text-[#655b4d] transition hover:bg-[#eee6da] hover:text-[#211e19]" aria-label="대본 닫기">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 sm:px-8">
              {parsedScriptLines.map((line, index) => {
                const isActive = index === activeScriptIndex;
                return <p key={line.id} ref={isActive ? activeItemRef : null} onClick={() => seekTo(line.timeSec)} className={`cursor-pointer rounded-2xl px-4 py-3 text-[15px] leading-7 transition sm:text-base ${isActive ? 'bg-[#f0ded5] font-semibold text-[#211e19]' : 'text-[#655b4d] hover:bg-[#f2ece2]'}`}><span className="mr-3 text-xs font-mono text-[#a94d35]">{formatTime(line.timeSec)}</span>{line.text}</p>;
              })}
            </div>
            <div className="  px-6 py-4 text-xs text-[#786d5e] sm:px-8">문장을 누르면 해당 오디오 구간으로 이동합니다.</div>
          </div>
        </div>
      )}
    </>
  );
};
