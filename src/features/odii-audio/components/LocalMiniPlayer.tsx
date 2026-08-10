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
    const updateVisibility = () => {
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
      const hasStartedPlayback = isPlaying || currentTime > 0;
      // 기본으로 선택된 이야기는 재생바를 띄우지 않는다. 모바일에서는 사용자가
      // 실제 재생을 시작한 뒤에만 탭바 위에서 조작할 수 있게 한다.
      // 데스크톱에서는 본문을 가리지 않도록 기존의 스크롤/재생 기준을 유지한다.
      setIsVisible(isMobileViewport ? hasStartedPlayback : window.scrollY > 220 || isPlaying);
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [currentTime, isPlaying]);

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

  if (!isVisible) return null;

  return <>
    <motion.div layout initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[110] w-[calc(100%-1.5rem)] max-w-xl overflow-hidden rounded-[18px] border border-[#D42058]/20 bg-[#fff9fb]/95 shadow-[0_14px_32px_rgba(105,25,53,0.18)] backdrop-blur-xl md:bottom-[calc(1.25rem+env(safe-area-inset-bottom))] md:z-50 md:w-[calc(100%-2rem)] md:rounded-2xl">
      <div className="h-0.5 bg-[#F8D7E2] sm:h-1"><div className="h-full bg-[#D42058] transition-[width] duration-300" style={{ width: `${audioProgress}%` }} /></div>
      <div className="flex items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5"><button type="button" onClick={() => setIsExpanded(true)} className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3" aria-label={`${story.title} 전체 플레이어 열기`}><motion.img layoutId="odii-player-art" src={story.imageUrl} alt="" className="h-9 w-9 rounded-[10px] object-cover sm:h-10 sm:w-10 sm:rounded-xl"/><span className="min-w-0"><span className="block truncate font-maruburi text-[13px] font-semibold leading-5 text-[#211e19] sm:text-sm">{story.title}</span><span className="hidden text-[11px] text-[#786d5e] sm:block">{formatTime(currentTime)} / {formatTime(duration)}</span></span></button><button type="button" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? '일시정지' : '재생'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D42058] text-white shadow-[0_4px_10px_rgba(212,32,88,0.28)] sm:h-10 sm:w-10"><PlayIcon /></button><button type="button" onClick={() => setIsExpanded(true)} className="hidden items-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold text-[#786d5e] hover:bg-[#FCE7EE] sm:flex">자세히<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2"><path d="m7 10 5 5 5-5" /></svg></button></div>
    </motion.div>

    <AnimatePresence>{isExpanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#211e19]/35 backdrop-blur-sm md:z-[60]" onClick={closePlayer}><motion.aside layout initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ type: 'spring', damping: 30, stiffness: 340 }} onClick={(event) => event.stopPropagation()} className={`absolute bottom-0 left-0 right-0 flex flex-col overflow-y-auto rounded-t-3xl bg-[#fbf8f2] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isTranscriptOpen ? 'max-h-[88dvh]' : 'max-h-[90dvh]'} lg:bottom-6 lg:left-auto lg:right-6 lg:w-[460px] lg:rounded-3xl lg:p-6 ${isTranscriptOpen ? 'lg:max-h-[86vh]' : ''}`}>
      {isTranscriptOpen ? <>
        <header className="flex items-center justify-between border-b border-[#211e19]/10 pb-4"><button type="button" onClick={() => setIsTranscriptOpen(false)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#655b4d] hover:text-[#211e19]">← 플레이어로</button><button type="button" onClick={closePlayer} className="flex h-9 w-9 items-center justify-center rounded-full text-[#655b4d] hover:bg-[#eee6da]" aria-label="패널 닫기">✕</button></header>
        <div className="flex items-center justify-between py-4"><div><p className="text-[10px] font-bold tracking-[0.15em] text-[#a94d35]">전체 대본</p><h2 className="mt-1 max-w-[290px] truncate font-maruburi text-lg font-semibold">{story.title}</h2></div><button type="button" onClick={() => setIsPlaying(!isPlaying)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a94d35] text-white"><PlayIcon /></button></div>
        <div className="relative pl-5 pr-2"><div className="pointer-events-none absolute bottom-0 left-0 top-0 w-0.5 bg-[#dfd2c2]"/><motion.div className="pointer-events-none absolute left-0 top-0 w-0.5 bg-[#d56748]" animate={{ height: `${transcriptProgress}%` }} transition={{ duration: 0.45 }}/><div className="space-y-2">{lines.map((line) => <button key={line.id} type="button" onClick={() => seekTo(line.timeSec)} className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm leading-6 transition ${line.id === lines[activeIndex]?.id ? 'bg-[#f1e0d7] font-semibold text-[#211e19]' : 'text-[#655b4d] hover:bg-[#f2ece2]'}`}>{line.text}</button>)}</div></div>
      </> : <>
        <div className="mb-5 flex items-center justify-between"><span className="text-[11px] font-bold tracking-[0.16em] text-[#a94d35]">지금 재생 중</span><button type="button" onClick={closePlayer} className="flex h-9 w-9 items-center justify-center rounded-full text-[#655b4d] hover:bg-[#eee6da]" aria-label="패널 닫기">✕</button></div>
        <motion.img layoutId="odii-player-art" src={story.imageUrl} alt={story.title} className="h-28 w-full rounded-2xl object-cover sm:h-44"/><p className="mt-3 text-xs font-semibold text-[#a94d35]">{story.category} · {story.locationName}</p><h2 className="mt-1 font-maruburi text-2xl font-semibold tracking-[-0.04em]">{story.audioTitle || story.title}</h2><p className="mt-1.5 text-sm text-[#786d5e]">{story.speaker || '온마루 도슨트'}</p>
        <input type="range" min={0} max={duration || 100} value={currentTime} onChange={(event) => seekTo(Number(event.target.value))} className="mt-4 w-full accent-[#a94d35]"/><div className="flex justify-between text-xs text-[#786d5e]"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div><div className="mt-2 flex items-center justify-center gap-5"><button type="button" onClick={() => skipBackward(10)} className="text-xs font-semibold text-[#655b4d]">10초 전</button><button type="button" onClick={() => setIsPlaying(!isPlaying)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a94d35] text-white"><PlayIcon /></button><button type="button" onClick={() => skipForward(10)} className="text-xs font-semibold text-[#655b4d]">10초 후</button></div>
        {previewLines.length > 0 && <section className="mt-4 border-t border-[#211e19]/10 pt-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#a94d35]">이야기 미리보기</p><h3 className="mt-1 font-maruburi text-base font-semibold">듣고 있는 이야기</h3></div><button type="button" onClick={() => setIsTranscriptOpen(true)} className="inline-flex items-center gap-1 px-1 py-2 text-xs font-semibold text-[#a94d35] transition hover:text-[#7f3725]">전체 대본<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2"><path d="m7 10 5 5 5-5" /></svg></button></div><div className="relative mt-3 h-44 overflow-hidden pl-4"><div className="pointer-events-none absolute bottom-2 left-0 top-2 z-10 w-0.5 bg-[#dfd2c2]"/><div className="space-y-1.5 pb-12 pt-8 pl-2">{previewLines.map((line) => <button key={line.id} type="button" onClick={() => seekTo(line.timeSec)} className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm leading-5 transition ${line.id === lines[activeIndex]?.id ? 'font-semibold text-[#211e19]' : 'text-[#756557] hover:text-[#211e19]'}`}>{line.text}</button>)}</div><div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-9 bg-gradient-to-b from-[#fbf8f2] via-[#fbf8f2]/85 to-transparent"/><div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-[#fbf8f2] via-[#fbf8f2]/90 to-transparent"/></div></section>}
      </>}
    </motion.aside></motion.div>}</AnimatePresence>
  </>;
};
