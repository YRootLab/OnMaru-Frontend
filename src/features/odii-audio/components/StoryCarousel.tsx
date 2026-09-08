'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IoPlay,
  IoPause,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { getRailIndicator, shouldUpdateRailIndicator } from './storyCarouselMetrics';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
  isLoading?: boolean;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

function imageForStory(story: OdiiStoryItem): string {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((total, char) => total + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

function getScriptExcerpt(script = ''): string {
  const line = script.split(/\r?\n/).find((item) => item.trim());
  return line?.trim() || '장소에 머무는 시간을 오디오로 만나보세요.';
}

function formatDuration(story: OdiiStoryItem): string {
  if (story.formattedDuration) return story.formattedDuration;
  const seconds = Number(story.playTime);
  return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '오디오';
}

const dominantColorCache = new Map<string, string>();

function getDominantColor(imageUrl: string): Promise<string> {
  const cached = dominantColorCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(image, 0, 0, 16, 16);
        const pixels = context.getImageData(0, 0, 16, 16).data;
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;
        for (let index = 0; index < pixels.length; index += 16) {
          const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
          if (pixels[index + 3] < 180 || brightness < 18 || brightness > 238) continue;
          red += pixels[index];
          green += pixels[index + 1];
          blue += pixels[index + 2];
          count += 1;
        }
        const color = count ? `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})` : '#e5e5e3';
        dominantColorCache.set(imageUrl, color);
        resolve(color);
      } catch {
        resolve('#e5e5e3');
      }
    };
    image.onerror = () => resolve('#e5e5e3');
    image.src = imageUrl;
  });
}

function scheduleIdleWork(callback: () => void): () => void {
  const idleWindow = window as Window & {
    requestIdleCallback?: (idleCallback: () => void, options: { timeout: number }) => number;
    cancelIdleCallback?: (idleId: number) => void;
  };
  if (idleWindow.requestIdleCallback) {
    const idleId = idleWindow.requestIdleCallback(callback, { timeout: 1200 });
    return () => idleWindow.cancelIdleCallback?.(idleId);
  }
  const timeoutId = window.setTimeout(callback, 200);
  return () => window.clearTimeout(timeoutId);
}

interface NearbyStoryCardProps {
  story: OdiiStoryItem;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}

const NearbyStoryCard: React.FC<NearbyStoryCardProps> = ({ story, isCurrent, isPlaying, onSelect }) => {
  const imageSrc = imageForStory(story);
  const [isHovered, setIsHovered] = useState(false);
  const [accentColor, setAccentColor] = useState(() => dominantColorCache.get(imageSrc) || '#e5e5e3');

  useEffect(() => {
    let mounted = true;
    const cancel = scheduleIdleWork(() => {
      getDominantColor(imageSrc).then((color) => {
        if (mounted) setAccentColor(color);
      });
    });
    return () => {
      mounted = false;
      cancel();
    };
  }, [imageSrc]);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isCurrent}
      style={isHovered && !isCurrent ? { backgroundColor: `color-mix(in srgb, ${accentColor} 12%, white)` } : undefined}
      className={`group grid w-[min(94vw,25.5rem)] shrink-0 snap-start grid-cols-[125px_minmax(0,1fr)] gap-4 overflow-hidden rounded-xl border p-3 text-left transition-colors duration-200 sm:w-[25.5rem] sm:grid-cols-[132px_minmax(0,1fr)] ${
        isCurrent
          ? 'border-[#f84e76]/45 bg-white'
          : 'border-[#e5e5e3] bg-white hover:border-[#d7d7d4]'
      }`}
    >
      <div className="relative min-h-[136px] overflow-hidden rounded-[10px] bg-[#e5e5e3] sm:min-h-[144px]">
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            (event.target as HTMLImageElement).src = FALLBACK_IMAGES[0];
          }}
          className={`h-full w-full object-cover ${isCurrent ? 'brightness-95 saturate-[0.88]' : 'brightness-[0.9] saturate-[0.82]'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211e19]/65 via-transparent to-transparent" />

        {/* 재생 컨트롤 원형 버블 */}
        <span className={`absolute bottom-2.5 left-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full  backdrop-blur-xs transition-all duration-300 sm:h-8.5 sm:w-8.5 ${
          isPlaying
            ? 'bg-[#a94d35] text-white  ring-white/90 '
            : 'bg-white/95 text-[#211e19]  ring-white/90 '
        }`}>
          {isPlaying ? (
            <IoPause size={14} />
          ) : (
            <IoPlay size={14} className="ml-0.5" />
          )}
        </span>
      </div>

      <div className="flex min-w-0 flex-col justify-between py-0.5 pr-0.5">
        <div className="min-w-0">
          {/* 1. 메인 타이틀 */}
          <h3 className={`font-odii-sans text-[14px] font-bold leading-tight tracking-[-0.035em] transition-colors duration-300 line-clamp-1 ${
            isCurrent ? 'text-[#a94d35]' : 'text-[#211e19] group-hover:text-[#a94d35]'
          }`}>
            {story.title}
          </h3>

          {/* 2. 서브타이틀 / 오디오 소제목 */}
          <p className="mt-0.5 truncate text-[10px] font-medium leading-4 text-[#655b4d]">
            {story.audioTitle}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="inline-flex rounded-[4px] bg-[#f84e76]/10 px-1.5 py-px text-[10px] font-semibold leading-4 text-[#f84e76]">
              {story.category}
            </span>
            <span className="truncate text-[10px] font-medium leading-4 text-[#786d5e]" title={story.locationName || '대한민국 문화유산'}>
              {story.locationName || '대한민국 문화유산'}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#786d5e]">{getScriptExcerpt(story.script)}</p>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-[#211e19]/[0.07] pt-2 text-[9.5px] text-[#786d5e]">
          <span className="font-mono font-semibold text-[#655b4d]">{formatDuration(story)}</span>
          <span className="truncate font-medium text-[#8c7e6c]">{story.speaker || '온마루 도슨트'}</span>
        </div>
      </div>
    </button>
  );
};

export const StoryCarouselSkeleton: React.FC = () => (
  <div aria-label="주변 오디오 로딩 중" className="relative w-full overflow-hidden">
    <div className="flex gap-4 overflow-x-auto px-6 pt-3 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8">
      {[1, 2, 3].map((id) => (
        <div
          key={id}
          className="grid min-h-[176px] w-[min(94vw,25.5rem)] shrink-0 grid-cols-[125px_minmax(0,1fr)] gap-4 overflow-hidden rounded-xl border border-[#e5e5e3] bg-white p-3 sm:min-h-[184px] sm:w-[25.5rem] sm:grid-cols-[132px_minmax(0,1fr)]"
        >
          {/* 섬네일 스켈레톤 */}
          <div className="odii-skeleton relative h-auto min-h-[176px] w-full self-stretch overflow-hidden rounded-[10px] bg-[#e5e5e3] sm:min-h-[184px]">
            <div className="odii-skeleton absolute bottom-2.5 left-2.5 h-8 w-8 rounded-full bg-[#dfd2be]" />
          </div>

          {/* 우측 텍스트 정보 스켈레톤 */}
          <div className="flex flex-col justify-between py-0.5 pr-0.5">
            <div>
              {/* 타이틀 스켈레톤 */}
              <div className="odii-skeleton h-4 w-4/5 rounded-md bg-[#dfd2be]" />
              {/* 서브타이틀 스켈레톤 */}
              <div className="odii-skeleton mt-0.5 h-3.5 w-3/5 rounded bg-[#e8ded0]" />
              {/* 주제 태그 + 장소 스켈레톤 */}
              <div className="mt-1">
                <div className="odii-skeleton h-4 w-16 rounded-full bg-[#e8ded0]" />
                <div className="mt-0.5 flex items-start gap-1">
                  <div className="odii-skeleton mt-0.5 h-3 w-3 rounded-full bg-[#e5d9c7]" />
                  <div className="flex-1 space-y-1">
                    <div className="odii-skeleton h-3.5 w-full rounded bg-[#e5d9c7]" />
                    <div className="odii-skeleton h-3.5 w-3/4 rounded bg-[#e5d9c7]" />
                  </div>
                </div>
              </div>
              {/* 한지 오디오 인용구 박스 스켈레톤 */}
              <div className="mt-1 rounded-r-lg border-l-2  bg-[#211e19]/04 py-1 pl-2 pr-1 space-y-1.5">
                <div className="odii-skeleton h-3 w-full rounded bg-[#e8ded0]" />
                <div className="odii-skeleton h-3 w-3/4 rounded bg-[#e8ded0]" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between   pt-1.5">
              <div className="odii-skeleton h-3.5 w-10 rounded bg-[#e5d9c7]" />
              <div className="odii-skeleton h-3.5 w-20 rounded bg-[#e5d9c7]" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="h-[18px] px-6 sm:px-8" aria-hidden="true">
      <div className="odii-skeleton ml-auto h-3 w-16 rounded bg-[#e5d9c7]" />
    </div>
  </div>
);

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ stories, isLoading }) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [railIndicator, setRailIndicator] = useState({ left: 0, width: 100, index: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isMovedRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const indicatorFrameRef = useRef<number | null>(null);
  const snapMetricsRef = useRef<{ offsets: number[]; maxScroll: number }>({ offsets: [], maxScroll: 0 });

  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  const handleCardClick = (story: OdiiStoryItem) => {
    if (isMovedRef.current) {
      isMovedRef.current = false;
      return;
    }
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const measureSnapPoints = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(rail.children) as HTMLElement[];
    if (cards.length === 0) {
      snapMetricsRef.current = { offsets: [], maxScroll: 0 };
      return;
    }

    const firstCardLeft = cards[0].offsetLeft;
    snapMetricsRef.current = {
      offsets: cards.map((card) => card.offsetLeft - firstCardLeft),
      maxScroll: rail.scrollWidth - rail.clientWidth,
    };
  }, []);

  const getNearestCardScrollLeft = (currentScrollLeft: number, velocity: number) => {
    if (snapMetricsRef.current.offsets.length === 0) measureSnapPoints();
    const { offsets, maxScroll } = snapMetricsRef.current;
    if (offsets.length === 0) return currentScrollLeft;

    // 속도 기반 미래 스크롤 예측 지점 (속도가 크면 1~2개 카드 이상 미끄러짐)
    const projectedLeft = currentScrollLeft - velocity * 180;

    let closestScrollLeft = 0;
    let minDistance = Math.abs(projectedLeft - 0);

    for (const cardTarget of offsets) {
      const distance = Math.abs(projectedLeft - cardTarget);
      if (distance < minDistance) {
        minDistance = distance;
        closestScrollLeft = cardTarget;
      }
    }

    return Math.max(0, Math.min(maxScroll, closestScrollLeft));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    isMouseDownRef.current = true;
    isMovedRef.current = false;
    measureSnapPoints();
    startXRef.current = e.pageX;
    scrollLeftRef.current = rail.scrollLeft;

    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !railRef.current) return;
    const rail = railRef.current;
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const currentX = e.pageX;

    if (dt > 0) {
      const dx = currentX - lastXRef.current;
      velocityRef.current = dx / dt;
    }

    lastXRef.current = currentX;
    lastTimeRef.current = now;

    const walk = (currentX - startXRef.current) * 1.1;
    if (Math.abs(walk) > 6) {
      isMovedRef.current = true;
    }
    rail.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsDragging(false);

    const rail = railRef.current;
    if (!rail) return;

    // 관성 속도 및 가까운 카드 위치로 100% 부드러운 스무스 정렬
    const targetLeft = getNearestCardScrollLeft(rail.scrollLeft, velocityRef.current);
    rail.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const scheduleRailIndicatorUpdate = useCallback(() => {
    if (indicatorFrameRef.current !== null) return;
    indicatorFrameRef.current = requestAnimationFrame(() => {
      indicatorFrameRef.current = null;
      const rail = railRef.current;
      if (!rail) return;
      const next = getRailIndicator({
        scrollLeft: rail.scrollLeft,
        scrollWidth: rail.scrollWidth,
        clientWidth: rail.clientWidth,
      }, stories.length);
      setRailIndicator((previous) => shouldUpdateRailIndicator(previous, next) ? next : previous);
    });
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
    measureSnapPoints();
    scheduleRailIndicatorUpdate();
    const handleResize = () => {
      measureSnapPoints();
      scheduleRailIndicatorUpdate();
    };
    rail.addEventListener('scroll', scheduleRailIndicatorUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      rail.removeEventListener('scroll', scheduleRailIndicatorUpdate);
      window.removeEventListener('resize', handleResize);
      if (indicatorFrameRef.current !== null) cancelAnimationFrame(indicatorFrameRef.current);
    };
  }, [measureSnapPoints, scheduleRailIndicatorUpdate]);

  if (isLoading) {
    return <StoryCarouselSkeleton />;
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-2xl   bg-[#fbf8f2] px-5 py-8 text-center">
        <p className="text-xs font-semibold text-[#655b4d]">아직 주변 이야기를 찾지 못했어요.</p>
        <p className="mt-1 text-[11px] text-[#8c7e6c]">위치를 허용하면 가까운 오디오부터 보여드릴게요.</p>
      </div>
    );
  }

  return (
    <div aria-label="주변 오디오 목록" className="relative w-full">
      {/* 스크롤 트랙 컨테이너 (하단/좌측 그림자 절단 방지를 위해 pt-3 pb-8 스페이싱 확보) */}
      <div className="relative">
        <div
          ref={railRef}
          tabIndex={0}
          aria-label="주변 오디오를 좌우로 살펴보기"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
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
          className={`flex gap-3.5 touch-pan-x overflow-x-auto px-6 pt-3 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8 sm:pb-9 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ overflowAnchor: 'none' }}
        >
          {stories.map((story, index) => (
            <NearbyStoryCard
              key={`${story.stid}-${index}`}
              story={story}
              isCurrent={currentStory.stid === story.stid}
              isPlaying={currentStory.stid === story.stid && isPlaying}
              onSelect={() => handleCardClick(story)}
            />
          ))}
        </div>

        {/* 🌟 슬림하고 콤팩트한 가장자리 리니어 그라데이션 오버레이 */}
        {railIndicator.left > 0.5 && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white via-white/95 to-transparent sm:w-16" aria-hidden="true" />
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white via-white/60 to-transparent sm:w-9" aria-hidden="true" />
        )}

        {/* 좌/우 플로팅 네비게이션 화살표 버튼 (z-30 배치) */}
        {railIndicator.left > 0.5 && (
          <button
            type="button"
            aria-label="이전 주변 오디오 보기"
            onClick={() => moveRail(-1)}
            className="absolute left-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e5e3] bg-white text-[#211e19] shadow-sm transition-colors duration-200 hover:border-[#d0d0cd] hover:bg-[#f8f8f7] sm:left-3 sm:h-9 sm:w-9"
          >
            <IoChevronBackOutline size={18} />
          </button>
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <button
            type="button"
            aria-label="다음 주변 오디오 보기"
            onClick={() => moveRail(1)}
            className="absolute right-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full  bg-white/95 text-[#211e19]  backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white sm:right-2 sm:h-9 sm:w-9"
          >
            <IoChevronForwardOutline size={18} />
          </button>
        )}
      </div>

      {/* 📍 하단 우측 독립 인덱스 카운터 (01 / 19) */}
      {railIndicator.width < 100 && (
        <div className="flex items-center justify-end px-6 pt-1 pb-3 text-[11px] font-medium tracking-[0.08em] text-[#8c7e6c] sm:px-8 sm:pb-4" aria-live="polite">
          <span className="font-mono">
            <strong className="font-bold text-[#a94d35]">{String(railIndicator.index).padStart(2, '0')}</strong> / {String(stories.length).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
};
