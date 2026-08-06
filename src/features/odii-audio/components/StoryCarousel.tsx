'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
}

const FALLBACK_ART = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=640&q=78';

function getScriptExcerpt(script = ''): string {
  const line = script.split(/\r?\n/).find((item) => item.trim());
  return line?.trim() || '장소에 머무는 시간을 오디오로 만나보세요.';
}

function formatDuration(story: OdiiStoryItem): string {
  if (story.formattedDuration) return story.formattedDuration;
  const seconds = Number(story.playTime);
  return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '오디오';
}

const FALLBACK_ACCENTS = ['#b17a62', '#7f9181', '#a48d70', '#8b7d91', '#6f8b9b', '#b28b58'];

function getFallbackAccent(seed: string): string {
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % FALLBACK_ACCENTS.length;
  return FALLBACK_ACCENTS[index];
}

function extractDominantColor(imageUrl: string, seed: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve(getFallbackAccent(seed));
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();

        for (let index = 0; index < pixels.length; index += 16) {
          const alpha = pixels[index + 3];
          if (alpha < 160) continue;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const brightness = (red + green + blue) / 3;
          if (brightness > 248 || brightness < 14) continue;
          const bucket = [Math.round(red / 32) * 32, Math.round(green / 32) * 32, Math.round(blue / 32) * 32];
          const key = bucket.join(',');
          const current = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
          current.count += 1;
          current.red += red;
          current.green += green;
          current.blue += blue;
          buckets.set(key, current);
        }

        const dominant = [...buckets.values()].sort((left, right) => right.count - left.count)[0];
        if (!dominant) {
          resolve(getFallbackAccent(seed));
          return;
        }
        resolve(`rgb(${Math.round(dominant.red / dominant.count)}, ${Math.round(dominant.green / dominant.count)}, ${Math.round(dominant.blue / dominant.count)})`);
      } catch {
        resolve(getFallbackAccent(seed));
      }
    };
    image.onerror = () => resolve(getFallbackAccent(seed));
    image.src = imageUrl || FALLBACK_ART;
  });
}

interface NearbyStoryCardProps {
  story: OdiiStoryItem;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}

const NearbyStoryCard: React.FC<NearbyStoryCardProps> = ({ story, isCurrent, isPlaying, onSelect }) => {
  const [accentColor, setAccentColor] = useState(() => getFallbackAccent(`${story.stid}${story.imageUrl}`));

  useEffect(() => {
    let isMounted = true;
    extractDominantColor(story.imageUrl, `${story.stid}${story.imageUrl}`).then((color) => {
      if (isMounted) setAccentColor(color);
    });
    return () => {
      isMounted = false;
    };
  }, [story.imageUrl, story.stid]);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isCurrent}
      style={{ isolation: 'isolate' }}
      className={`group relative z-0 grid w-[min(86vw,22rem)] shrink-0 snap-start grid-cols-[88px_minmax(0,1fr)] gap-2.5 overflow-hidden rounded-[1.1rem] border p-1.5 text-left transition-[border-color,background-color,box-shadow] duration-300 hover:z-20 focus-visible:z-20 active:z-20 sm:w-[22rem] sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-3 sm:p-2 ${
        isCurrent
          ? 'border-[#a94d35]/45 bg-[#fffaf3] shadow-[0_8px_18px_rgba(61,45,29,0.1)]'
          : 'border-[#211e19]/10 bg-[#fbf8f2] hover:border-[#a94d35]/35 hover:shadow-[0_8px_20px_rgba(61,45,29,0.1)]'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] blur-[1px]"
        style={{ background: `radial-gradient(ellipse 72% 110% at 88% 12%, ${accentColor} 0%, transparent 68%)` }}
      />
      <div className="pointer-events-none absolute -left-1/2 top-0 z-20 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-[480%] group-hover:opacity-60 group-focus-visible:translate-x-[480%] group-focus-visible:opacity-60 group-active:translate-x-[480%] group-active:opacity-45" />
      <div className="relative z-10 min-h-[108px] overflow-hidden rounded-[0.85rem] bg-[#d8cfbf]">
        <img
          src={story.imageUrl || FALLBACK_ART}
          alt=""
          onError={(event) => {
            (event.target as HTMLImageElement).src = FALLBACK_ART;
          }}
          className={`h-full w-full object-cover transition-[filter] duration-500 ${isCurrent ? 'brightness-[0.92] saturate-[0.78]' : 'brightness-[0.84] saturate-[0.72]'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211e19]/60 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fffaf3] text-[#211e19] shadow-sm">
          {isPlaying ? (
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14h4v14h-4V5z" /></svg>
          ) : (
            <svg className="ml-0.5 h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </span>
        {story.distance && <span className="absolute right-2 top-2 rounded-full bg-[#fffaf3]/95 px-1.5 py-1 text-[9px] font-bold text-[#211e19]">{story.distance}</span>}
      </div>

      <div className="relative z-10 flex min-w-0 flex-col justify-between py-0.5 pr-1">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[9px] font-bold text-[#a94d35]">{story.category}</span>
            <span className="truncate text-[9px] text-[#8c7e6c]">{story.locationName || '대한민국 문화 공간'}</span>
          </div>
          <h3 className={`mt-1 line-clamp-2 font-odii-sans text-sm font-bold leading-[1.25] tracking-[-0.03em] ${isCurrent ? 'text-[#a94d35]' : 'text-[#211e19]'}`}>
            {story.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-[#655b4d]">{story.audioTitle}</p>
          <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#8c7e6c]">“{getScriptExcerpt(story.script)}”</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5 border-t border-[#211e19]/10 pt-2 text-[9px] text-[#786d5e]">
          <span className="font-mono">{formatDuration(story)}</span>
          <span className="text-[#b5a795]">·</span>
          <span className="truncate">{story.speaker || '온마루 도슨트'}</span>
        </div>
      </div>
    </button>
  );
};

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories }) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [railIndicator, setRailIndicator] = useState({ left: 0, width: 100, index: 1 });
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const handleCardClick = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const updateRailIndicator = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    if (maxScrollLeft <= 4) {
      setRailIndicator({ left: 0, width: 100, index: 1 });
      return;
    }
    const width = Math.max(18, Math.min(100, (rail.clientWidth / rail.scrollWidth) * 100));
    const left = (rail.scrollLeft / maxScrollLeft) * (100 - width);
    const index = Math.min(stories.length, Math.max(1, Math.round((rail.scrollLeft / maxScrollLeft) * (stories.length - 1)) + 1));
    setRailIndicator({ left, width, index });
  }, [stories.length]);

  const moveRail = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(240, rail.clientWidth * 0.82), behavior: 'smooth' });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = 0;
    updateRailIndicator();
    rail.addEventListener('scroll', updateRailIndicator, { passive: true });
    window.addEventListener('resize', updateRailIndicator);
    return () => {
      rail.removeEventListener('scroll', updateRailIndicator);
      window.removeEventListener('resize', updateRailIndicator);
    };
  }, [updateRailIndicator]);

  if (stories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#211e19]/15 bg-[#fbf8f2] px-5 py-8 text-center">
        <p className="text-xs font-semibold text-[#655b4d]">아직 주변 이야기를 찾지 못했어요.</p>
        <p className="mt-1 text-[11px] text-[#8c7e6c]">위치를 허용하면 가까운 오디오부터 보여드릴게요.</p>
      </div>
    );
  }

  return (
    <div aria-label="주변 오디오 목록" className="relative w-full">
      <div className="relative">
        <div
          ref={railRef}
          tabIndex={0}
          aria-label="주변 오디오를 좌우로 살펴보기"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              moveRail(-1);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              moveRail(1);
            }
          }}
          className="flex snap-x snap-mandatory gap-2.5 touch-pan-x cursor-grab overflow-x-auto px-6 py-8 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8"
          style={{ overflowAnchor: 'none' }}
        >
          {stories.map((story) => (
            <NearbyStoryCard
              key={story.stid}
              story={story}
              isCurrent={currentStory.stid === story.stid}
              isPlaying={currentStory.stid === story.stid && isPlaying}
              onSelect={() => handleCardClick(story)}
            />
          ))}
        </div>

        {railIndicator.left > 0.5 && (
          <button
            type="button"
            aria-label="이전 주변 오디오 보기"
            onClick={() => moveRail(-1)}
            className="absolute bottom-8 left-0 top-8 z-30 flex w-11 items-center justify-center bg-gradient-to-r from-white via-white/80 to-transparent text-[#655b4d] transition-[color,opacity] duration-200 hover:text-[#211e19] focus-visible:text-[#211e19]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14.5 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <button
            type="button"
            aria-label="다음 주변 오디오 보기"
            onClick={() => moveRail(1)}
            className="absolute bottom-8 right-0 top-8 z-30 flex w-11 items-center justify-center bg-gradient-to-l from-white via-white/80 to-transparent text-[#655b4d] transition-[color,opacity] duration-200 hover:text-[#211e19] focus-visible:text-[#211e19]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m9.5 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {railIndicator.left > 0.5 && (
          <div className="pointer-events-none absolute inset-y-6 left-0 z-10 w-7 bg-gradient-to-r from-white/90 to-transparent" aria-hidden="true" />
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <div className="pointer-events-none absolute inset-y-6 right-0 z-10 w-7 bg-gradient-to-l from-white/90 to-transparent" aria-hidden="true" />
        )}

        {railIndicator.width < 100 && (
          <div className="flex items-center justify-end px-6 pt-1 text-[10px] font-medium tracking-[0.08em] text-[#8c7e6c] sm:px-8" aria-live="polite">
            <span>{String(railIndicator.index).padStart(2, '0')} / {String(stories.length).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
