'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { useOdiiAudioPlayer } from '../hooks/useOdiiAudioPlayer';

const formatTime = (seconds: number) => `${Math.floor(Math.max(0, seconds || 0) / 60)}:${String(Math.floor(Math.max(0, seconds || 0) % 60)).padStart(2, '0')}`;

const PlayIcon: React.FC = () => {
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  return isPlaying
    ? <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
    : <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
};

export const LocalMiniPlayer: React.FC = () => {
  const story = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const currentTime = useOdiiAudioStore((s) => s.currentTime);
  const duration = useOdiiAudioStore((s) => s.duration);
  const activeIndex = useOdiiAudioStore((s) => s.activeScriptIndex);
  const lines = useOdiiAudioStore((s) => s.parsedScriptLines);
  const isExpanded = useOdiiAudioStore((s) => s.isPlayerExpanded);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const setIsExpanded = useOdiiAudioStore((s) => s.setIsPlayerExpanded);
  const skipForward = useOdiiAudioStore((s) => s.skipForward);
  const skipBackward = useOdiiAudioStore((s) => s.skipBackward);
  const { seekTo } = useOdiiAudioPlayer();
  const [isVisible, setIsVisible] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 220 || isPlaying);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, [isPlaying]);

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isExpanded]);

  const previewStart = Math.max(0, Math.min(activeIndex, Math.max(0, lines.length - 6)));
  const previewLines = lines.slice(previewStart, previewStart + 6);
  const audioProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const transcriptProgress = lines.length ? ((activeIndex + 1) / lines.length) * 100 : 0;
  const closePlayer = () => { setIsTranscriptOpen(false); setIsExpanded(false); };

  return (
    <>
      {/* 하단 플로팅 미니 플레이어 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="mini-player-floating-bar"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto w-auto max-w-xl overflow-hidden rounded-[1.35rem] border border-[#d2c3b1]/80 bg-[#fbf8f2]/95 px-3.5 pt-2.5 pb-3.5 shadow-[0_18px_44px_rgba(61,45,29,0.2)] backdrop-blur-xl sm:px-4 sm:pt-3 sm:pb-4"
          >
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setIsExpanded(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img src={story.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"/>
          <span className="min-w-0">
            <span className="block truncate font-odii-sans text-sm font-semibold text-[#211e19]">
              {story.title}
            </span>
            <span className="block text-[11px] text-[#786d5e]">
              <span className="text-[#a94d35] font-semibold">{story.category}</span> · {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </span>
        </button>

        <button type="button" onClick={() => setIsPlaying(!isPlaying)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a94d35] text-white shadow-sm hover:bg-[#8f3e29] transition-transform hover:scale-105">
          <PlayIcon />
        </button>
        <button type="button" onClick={() => setIsExpanded(true)} className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#655b4d] hover:bg-[#eee6da] sm:flex">
          대본 보기
        </button>
      </div>

      {/* 🎵 미니 플레이어 최하단 바닥면에 착 붙는 슬림(h-[2.5px]) 둥근 프로그레스 바 */}
      <div className="absolute bottom-1.5 left-4 right-4 sm:left-5 sm:right-5">
        <div className="h-[2.5px] w-full overflow-hidden rounded-full bg-[#211e19]/10">
          <div
            className="h-full rounded-full bg-[#a94d35] transition-[width] duration-300"
            style={{ width: `${audioProgress}%` }}
          />
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

    {/* 확장 플레이어 & 전체 대본 Drawer */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-[#211e19]/40 backdrop-blur-sm"
          onClick={closePlayer}
        >
          <motion.aside
            layout
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
            className={`absolute bottom-0 left-0 right-0 flex flex-col overflow-y-auto rounded-t-3xl bg-[#fbf8f2] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isTranscriptOpen ? 'max-h-[88dvh]' : 'max-h-[90dvh]'
            } lg:bottom-6 lg:left-1/2 lg:right-auto lg:ml-[-230px] lg:w-[460px] lg:rounded-3xl lg:p-7 ${isTranscriptOpen ? 'lg:max-h-[86vh]' : ''}`}
          >
            {isTranscriptOpen ? (
              <>
                <header className="flex items-center justify-between border-b border-[#211e19]/10 pb-4">
                  <button type="button" onClick={() => setIsTranscriptOpen(false)} className="inline-flex items-center gap-1 text-xs font-bold text-[#a94d35] hover:text-[#7f3725]">
                    ← 오디오 플레이어로
                  </button>
                  <button type="button" onClick={closePlayer} className="flex h-8 w-8 items-center justify-center rounded-full text-[#655b4d] hover:bg-[#eee6da]" aria-label="패널 닫기">
                    ✕
                  </button>
                </header>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-[#f1e5d6] text-[10px] font-bold text-[#a94d35]">
                      {story.category}
                    </span>
                    <h2 className="mt-1.5 max-w-[280px] truncate font-odii-sans text-lg font-semibold text-[#211e19]">
                      {story.title}
                    </h2>
                    <p className="text-xs text-[#655b4d]">{story.locationName || '대한민국 문화유산'}</p>
                  </div>
                  <button type="button" onClick={() => setIsPlaying(!isPlaying)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a94d35] text-white shadow-md">
                    <PlayIcon />
                  </button>
                </div>

                <div className="relative pl-5 pr-2 pt-2">
                  <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-0.5 bg-[#dfd2c2]" />
                  <motion.div className="pointer-events-none absolute left-0 top-0 w-0.5 bg-[#a94d35]" animate={{ height: `${transcriptProgress}%` }} transition={{ duration: 0.45 }} />
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => seekTo(line.timeSec)}
                        className={`block w-full rounded-xl px-3.5 py-3 text-left text-sm leading-6 transition ${
                          line.id === lines[activeIndex]?.id
                            ? 'bg-[#f3e9dc] font-semibold text-[#211e19] shadow-sm'
                            : 'text-[#655b4d] hover:bg-[#f5eee4]'
                        }`}
                      >
                        {line.text}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#a94d35]/10 text-[10px] font-bold text-[#a94d35] tracking-wider">
                    지금 재생 중
                  </span>
                  <button type="button" onClick={closePlayer} className="flex h-8 w-8 items-center justify-center rounded-full text-[#655b4d] hover:bg-[#eee6da]" aria-label="패널 닫기">
                    ✕
                  </button>
                </div>

                <motion.img layoutId="odii-player-art" src={story.imageUrl} alt={story.title} className="h-36 w-full rounded-2xl object-cover shadow-md sm:h-48"/>

                {/* 메인 타이틀 & 서브타이틀 UX 개선 */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#f1e5d6] text-[10px] font-bold text-[#a94d35]">
                      {story.category}
                    </span>
                    <span className="text-xs font-medium text-[#655b4d]">
                      {story.locationName || '대한민국 문화유산'}
                    </span>
                  </div>

                  <h2 className="mt-2 font-odii-sans text-xl sm:text-2xl font-bold text-[#211e19] leading-tight">
                    {story.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#655b4d]">
                    {story.audioTitle} · <span className="text-[#8f7e6c] font-medium">{story.speaker || '온마루 문화해설사'}</span>
                  </p>
                </div>

                {/* 오디오 탐색 프로그레스 바 & 컨트롤 */}
                <div className="mt-5">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    className="w-full accent-[#a94d35] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-mono text-[#786d5e] mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-6">
                  <button type="button" onClick={() => skipBackward(10)} className="px-3 py-1.5 rounded-full bg-[#f2ece2] text-xs font-bold text-[#655b4d] hover:bg-[#e8dfd2]">
                    10초 전
                  </button>
                  <button type="button" onClick={() => setIsPlaying(!isPlaying)} className="flex h-13 w-13 items-center justify-center rounded-full bg-[#a94d35] text-white shadow-lg hover:bg-[#8f3e29]">
                    <PlayIcon />
                  </button>
                  <button type="button" onClick={() => skipForward(10)} className="px-3 py-1.5 rounded-full bg-[#f2ece2] text-xs font-bold text-[#655b4d] hover:bg-[#e8dfd2]">
                    10초 후
                  </button>
                </div>

                {/* 대본 미리보기 & 전체 대본 보기 전환 */}
                {previewLines.length > 0 && (
                  <section className="mt-5 border-t border-[#211e19]/10 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.14em] text-[#a94d35]">실시간 자막</p>
                        <h3 className="mt-0.5 font-odii-sans text-sm font-semibold text-[#211e19]">해설 대본</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTranscriptOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#a94d35]/10 text-xs font-bold text-[#a94d35] hover:bg-[#a94d35]/20 transition"
                      >
                        전체 대본 보기 ➔
                      </button>
                    </div>

                    <div className="relative mt-3 h-36 overflow-hidden rounded-xl bg-[#f5efe5] p-3">
                      <div className="space-y-1.5">
                        {previewLines.map((line) => (
                          <button
                            key={line.id}
                            type="button"
                            onClick={() => seekTo(line.timeSec)}
                            className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-xs sm:text-sm leading-relaxed transition ${
                              line.id === lines[activeIndex]?.id
                                ? 'bg-[#a94d35] font-semibold text-white shadow-xs'
                                : 'text-[#655b4d] hover:text-[#211e19]'
                            }`}
                          >
                            {line.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
