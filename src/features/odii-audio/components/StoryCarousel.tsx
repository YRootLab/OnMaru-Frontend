'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem } from '../types/odii.types';

interface StoryCarouselProps {
  stories: OdiiStoryItem[];
  isLoading?: boolean;
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
      className={`group relative z-0 grid w-[min(94vw,25.5rem)] shrink-0 snap-start grid-cols-[125px_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.4rem] border p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(61,45,29,0.12)] sm:w-[25.5rem] sm:grid-cols-[132px_minmax(0,1fr)] ${
        isCurrent
          ? 'border-[#a94d35]/50 bg-[#fffbf5] shadow-[0_12px_28px_rgba(169,77,53,0.14)] ring-1 ring-[#a94d35]/25'
          : 'border-[#211e19]/08 bg-[#faf7f2]/95 hover:border-[#a94d35]/35 hover:bg-[#fffaf4]'
      }`}
    >
      {/* 3D 깊이감 앰비언트 글로우 */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15 blur-sm transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: `radial-gradient(ellipse 80% 120% at 85% 15%, ${accentColor} 0%, transparent 70%)` }}
      />

      {/* 섬네일 비주얼 */}
      <div className="relative z-10 min-h-[136px] sm:min-h-[144px] overflow-hidden rounded-[1.1rem] bg-[#d8cfbf]">
        <img
          src={story.imageUrl || FALLBACK_ART}
          alt=""
          loading="eager"
          decoding="sync"
          onError={(event) => {
            (event.target as HTMLImageElement).src = FALLBACK_ART;
          }}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isCurrent ? 'brightness-95 saturate-[0.88]' : 'brightness-[0.88] saturate-[0.78]'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211e19]/65 via-transparent to-transparent" />

        {/* 재생 컨트롤 원형 버블 */}
        <span className={`absolute bottom-2.5 left-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-xs transition-all duration-300 sm:h-8.5 sm:w-8.5 ${
          isPlaying
            ? 'bg-[#a94d35] text-white ring-2 ring-white/90 shadow-[0_4px_12px_rgba(169,77,53,0.3)]'
            : 'bg-white/95 text-[#211e19] ring-2 ring-white/90 shadow-[0_4px_10px_rgba(0,0,0,0.15)]'
        }`}>
          {isPlaying ? (
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      </div>

      {/* 카드 우측 정보 서사 영역 (Apple App Store 에디토리얼 타이포그래피 위계) */}
      <div className="relative z-10 flex min-w-0 flex-col justify-between py-0.5 pr-0.5">
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

          {/* 3. 주제 태그 */}
          <div className="mt-1">
            <span className="inline-flex rounded-full bg-[#a94d35]/10 px-2 py-0.5 text-[10px] font-bold leading-4 text-[#a94d35]">
              {story.category}
            </span>
          </div>

          {/* 4. 장소는 태그와 분리해 읽기 흐름을 확보 */}
          <div
            className="mt-0.5 flex min-h-8 min-w-0 items-start gap-1 text-[10px] font-medium leading-4 text-[#786d5e]"
            title={story.locationName || '대한민국 문화유산'}
          >
            <svg className="mt-0.5 h-3 w-3 shrink-0 text-[#a94d35]/65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
              <circle cx="12" cy="9" r="2.2" />
            </svg>
            <span className="line-clamp-2 break-keep">{story.locationName || '대한민국 문화유산'}</span>
          </div>

          {/* 5. 한지 오디오 인용구 에디토리얼 박스 */}
          <div className="mt-1 rounded-r-lg border-l-2 border-[#a94d35]/50 bg-[#211e19]/[0.035] py-1 pl-2 pr-1">
            <p className="line-clamp-2 text-[10px] italic leading-relaxed text-[#594e40]">
              “{getScriptExcerpt(story.script)}”
            </p>
          </div>
        </div>

        {/* 6. 하단 메타바 (애플 스타일 1px 헤어라인 분리) */}
        <div className="mt-2.5 flex items-center justify-between border-t border-[#211e19]/08 pt-2 text-[9.5px] text-[#786d5e]">
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
          className="grid min-h-[176px] w-[min(94vw,25.5rem)] shrink-0 grid-cols-[125px_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.4rem] border border-[#211e19]/08 bg-[#faf7f2]/95 p-3 sm:min-h-[184px] sm:w-[25.5rem] sm:grid-cols-[132px_minmax(0,1fr)]"
        >
          {/* 섬네일 스켈레톤 */}
          <div className="odii-skeleton relative h-auto min-h-[176px] w-full self-stretch overflow-hidden rounded-[1.1rem] bg-[#e5d9c7] sm:min-h-[184px]">
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
              <div className="mt-1 rounded-r-lg border-l-2 border-[#a94d35]/30 bg-[#211e19]/04 py-1 pl-2 pr-1 space-y-1.5">
                <div className="odii-skeleton h-3 w-full rounded bg-[#e8ded0]" />
                <div className="odii-skeleton h-3 w-3/4 rounded bg-[#e8ded0]" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#211e19]/08 pt-1.5">
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

  const getNearestCardScrollLeft = (currentScrollLeft: number, velocity: number) => {
    const rail = railRef.current;
    if (!rail) return currentScrollLeft;

    const cards = Array.from(rail.children) as HTMLElement[];
    if (cards.length === 0) return currentScrollLeft;

    const firstCardLeft = cards[0].offsetLeft;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    
    // 속도 기반 미래 스크롤 예측 지점 (속도가 크면 1~2개 카드 이상 미끄러짐)
    const projectedLeft = currentScrollLeft - velocity * 180;

    let closestScrollLeft = 0;
    let minDistance = Math.abs(projectedLeft - 0);

    for (let i = 0; i < cards.length; i++) {
      const cardTarget = cards[i].offsetLeft - firstCardLeft;
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
    startXRef.current = e.pageX - rail.offsetLeft;
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

    const x = currentX - rail.offsetLeft;
    const walk = (x - startXRef.current) * 1.1;
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
    const targetLeft = getNearestCardScrollLeft(rail.scrollLeft, direction * -2);
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

  if (isLoading) {
    return <StoryCarouselSkeleton />;
  }

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
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white via-white/60 to-transparent sm:w-9" aria-hidden="true" />
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
            className="absolute left-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#211e19]/12 bg-white/95 text-[#211e19] shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white sm:left-2 sm:h-9 sm:w-9"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14.5 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <button
            type="button"
            aria-label="다음 주변 오디오 보기"
            onClick={() => moveRail(1)}
            className="absolute right-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#211e19]/12 bg-white/95 text-[#211e19] shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white sm:right-2 sm:h-9 sm:w-9"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9.5 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>

      {/* 📍 하단 우측 독립 인덱스 카운터 (01 / 19) */}
      {railIndicator.width < 100 && (
        <div className="flex items-center justify-end px-6 pt-1 text-[11px] font-medium tracking-[0.08em] text-[#8c7e6c] sm:px-8" aria-live="polite">
          <span className="font-mono">
            <strong className="font-bold text-[#a94d35]">{String(railIndicator.index).padStart(2, '0')}</strong> / {String(stories.length).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
};
