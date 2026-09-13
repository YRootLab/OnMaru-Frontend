'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { getRailIndicator, shouldUpdateRailIndicator } from './storyCarouselMetrics';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface StoryCarouselProps {
  stories: SorimaruStoryItem[];
  isLoading?: boolean;
}

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

function imageForStory(story: SorimaruStoryItem): string {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((total, char) => total + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

function getScriptExcerpt(script = ''): string {
  const line = script.split(/\r?\n/).find((item) => item.trim());
  return line?.trim() || '장소에 머무는 시간을 오디오로 만나보세요.';
}

function formatDuration(story: SorimaruStoryItem): string {
  if (story.formattedDuration) return story.formattedDuration;
  const seconds = Number(story.playTime);
  return Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '오디오';
}

const dominantColorCache = new Map<string, string>();

function getDominantColor(imageUrl: string): Promise<string> {
  const cached = dominantColorCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve('#e5e5e3');
          return;
        }
        context.drawImage(image, 0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        const color = `rgb(${r}, ${g}, ${b})`;
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

const CardButton = styled.button<{ $isCurrent: boolean; $isHovered: boolean; $accentColor: string }>`
  display: grid;
  width: min(94vw, 25.5rem);
  flex-shrink: 0;
  scroll-snap-align: start;
  grid-template-columns: 125px minmax(0, 1fr);
  gap: 1rem;
  overflow: hidden;
  border-radius: 1rem;
  padding: 0.75rem;
  text-align: left;
  transition: background-color 0.2s ease;
  border: none;
  cursor: pointer;

  @media (min-width: 640px) {
    width: 25.5rem;
    grid-template-columns: 132px minmax(0, 1fr);
  }

  background-color: ${({ $isCurrent, $isHovered, $accentColor }) =>
    $isCurrent
      ? '#FFF0F6'
      : $isHovered
      ? `color-mix(in srgb, ${$accentColor} 12%, white)`
      : '#f8f8f7'};

  &:hover {
    background-color: ${({ $isCurrent, $accentColor }) =>
      $isCurrent ? '#FFF0F6' : `color-mix(in srgb, ${$accentColor} 12%, white)`};
  }

  [data-theme='dark'] & {
    background-color: ${({ $isCurrent, $isHovered, $accentColor }) =>
      $isCurrent
        ? 'rgba(255, 92, 159, 0.22)'
        : $isHovered
        ? `color-mix(in srgb, ${$accentColor} 18%, ${surface.dark.card})`
        : surface.dark.surface};
    border: 1px solid rgba(255, 255, 255, 0.06);

    &:hover {
      background-color: ${({ $isCurrent, $accentColor }) =>
        $isCurrent
          ? 'rgba(255, 92, 159, 0.25)'
          : `color-mix(in srgb, ${$accentColor} 18%, ${surface.dark.card})`};
    }
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  min-height: 136px;
  overflow: hidden;
  border-radius: 10px;
  background-color: #e5e5e3;

  @media (min-width: 640px) {
    min-height: 144px;
  }
`;

const ThumbnailPhoto = styled.img<{ $isCurrent: boolean }>`
  height: 100%;
  width: 100%;
  object-fit: cover;
  filter: ${({ $isCurrent }) =>
    $isCurrent ? 'brightness(0.95) saturate(0.88)' : 'brightness(0.9) saturate(0.82)'};
`;

const BottomGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(33, 30, 25, 0.65), transparent 60%);
`;

const PlayBubble = styled.span<{ $isPlaying: boolean }>`
  position: absolute;
  bottom: 0.625rem;
  left: 0.625rem;
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;

  @media (min-width: 640px) {
    height: 2.125rem;
    width: 2.125rem;
  }

  ${({ $isPlaying }) =>
    $isPlaying
      ? `
        background-color: ${palette.jangmi[500]};
        color: #ffffff;
      `
      : `
        background-color: rgba(255, 255, 255, 0.95);
        color: ${meok[900]};
      `}

  [data-theme='dark'] & {
    ${({ $isPlaying }) =>
      $isPlaying
        ? `
          background-color: ${palette.jangmi[500]};
          color: #ffffff;
        `
        : `
          background-color: rgba(45, 41, 36, 0.9);
          color: ${meok[100]};
          border: 1px solid rgba(255, 255, 255, 0.1);
        `}
  }
`;

const CardInfoCol = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  padding-right: 0.125rem;
`;

const CardMainTitle = styled.h3<{ $isCurrent: boolean }>`
  font-family: var(--font-hanok);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.035em;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: ${({ $isCurrent }) => ($isCurrent ? palette.jangmi[500] : meok[900])};

  [data-theme='dark'] & {
    color: ${({ $isCurrent }) => ($isCurrent ? palette.jangmi[400] : meok[100])};
  }

  @media (min-width: 640px) {
    font-size: 1rem;
  }
`;

const CardSubTitle = styled.p`
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${fontSize.micro};
  font-weight: 500;
  line-height: 1rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const CategoryLocationRow = styled.div`
  margin-top: 0.25rem;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
`;

const MiniCategoryTag = styled.span`
  display: inline-flex;
  border-radius: 4px;
  background-color: rgba(255, 42, 133, 0.1);
  padding: 1px 0.375rem;
  font-size: ${fontSize.micro};
  font-weight: 600;
  line-height: 1rem;
  color: ${palette.jangmi[500]};

  [data-theme='dark'] & {
    color: ${palette.jangmi[400]};
    background-color: rgba(255, 92, 159, 0.15);
  }
`;

const LocationSpan = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${fontSize.micro};
  font-weight: 500;
  line-height: 1rem;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ExcerptText = styled.p`
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: ${fontSize.micro};
  line-height: 1.4;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const CardBottomMeta = styled.div`
  margin-top: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  font-size: ${fontSize.micro};
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

interface NearbyStoryCardProps {
  story: SorimaruStoryItem;
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
    <CardButton
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isCurrent}
      $isCurrent={isCurrent}
      $isHovered={isHovered}
      $accentColor={accentColor}
    >
      <ThumbnailContainer>
        <ThumbnailPhoto
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          $isCurrent={isCurrent}
          onError={(event) => {
            (event.target as HTMLImageElement).src = FALLBACK_IMAGES[0];
          }}
        />
        <BottomGradient />

        <PlayBubble $isPlaying={isPlaying}>
          {isPlaying ? (
            <Pause size={14} strokeWidth={2} />
          ) : (
            <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />
          )}
        </PlayBubble>
      </ThumbnailContainer>

      <CardInfoCol>
        <div style={{ minWidth: 0 }}>
          <CardMainTitle $isCurrent={isCurrent}>
            {story.title}
          </CardMainTitle>

          <CardSubTitle>
            {story.audioTitle}
          </CardSubTitle>

          <CategoryLocationRow>
            <MiniCategoryTag>
              {story.category}
            </MiniCategoryTag>
            <LocationSpan title={story.locationName || '대한민국 문화유산'}>
              {story.locationName || '대한민국 문화유산'}
            </LocationSpan>
          </CategoryLocationRow>

          <ExcerptText>{getScriptExcerpt(story.script)}</ExcerptText>
        </div>

        <CardBottomMeta>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: meok[700] }}>
            {formatDuration(story)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: meok[500] }}>
            {story.speaker || '온마루 도슨트'}
          </span>
        </CardBottomMeta>
      </CardInfoCol>
    </CardButton>
  );
};

const shimmerKeyframe = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e3 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmerKeyframe} 1.6s ease-in-out infinite;
  border-radius: 4px;
`;

export const StoryCarouselSkeleton: React.FC = () => (
  <div aria-label="주변 오디오 로딩 중" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.75rem 1.5rem 2rem', scrollbarWidth: 'none' }}>
      {[1, 2, 3].map((id) => (
        <div
          key={id}
          style={{
            display: 'grid',
            minHeight: '176px',
            width: 'min(94vw, 25.5rem)',
            flexShrink: 0,
            gridTemplateColumns: '125px minmax(0, 1fr)',
            gap: '1rem',
            overflow: 'hidden',
            borderRadius: '1rem',
            backgroundColor: '#f8f8f7',
            padding: '0.75rem',
          }}
        >
          <SkeletonBox style={{ minHeight: '176px', width: '100%', borderRadius: 10, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 10, left: 10, height: 32, width: 32, borderRadius: '50%', backgroundColor: '#d9d9d7' }} />
          </SkeletonBox>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px' }}>
            <div>
              <SkeletonBox style={{ height: 16, width: '80%', borderRadius: 6 }} />
              <SkeletonBox style={{ marginTop: 4, height: 14, width: '60%' }} />
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                <SkeletonBox style={{ height: 16, width: 64, borderRadius: 9999 }} />
                <SkeletonBox style={{ height: 14, width: 80 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <SkeletonBox style={{ height: 14, width: 40 }} />
              <SkeletonBox style={{ height: 14, width: 80 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CarouselOuter = styled.div`
  position: relative;
  width: 100%;
`;

const ScrollTrack = styled.div<{ $isDragging: boolean }>`
  display: flex;
  gap: 0.875rem;
  touch-action: pan-x;
  overflow-x: auto;
  padding: 0.75rem 1.5rem 2rem;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  overflow-anchor: none;
  cursor: ${({ $isDragging }) => ($isDragging ? 'grabbing' : 'grab')};
  user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')};

  @media (min-width: 640px) {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-bottom: 2.25rem;
  }
`;

const EdgeFadeLeft = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  width: 3rem;
  background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.95), transparent);

  [data-theme='dark'] & {
    background: linear-gradient(to right, ${surface.dark.app}, rgba(28, 26, 23, 0.95), transparent);
  }

  @media (min-width: 640px) {
    width: 4rem;
  }
`;

const EdgeFadeRight = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 10;
  width: 1.5rem;
  background: linear-gradient(to left, #ffffff, rgba(255, 255, 255, 0.6), transparent);

  [data-theme='dark'] & {
    background: linear-gradient(to left, ${surface.dark.app}, rgba(28, 26, 23, 0.6), transparent);
  }

  @media (min-width: 640px) {
    width: 2.25rem;
  }
`;

const FloatingNavBtn = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  z-index: 30;
  display: flex;
  height: 2rem;
  width: 2rem;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: #ffffff;
  color: ${meok[900]};
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    color: ${meok[100]};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background-color: ${surface.dark.elevated};
      color: ${palette.jangmi[400]};
    }
  }

  ${({ $side }) =>
    $side === 'left'
      ? `
        left: 0.5rem;
        @media (min-width: 640px) { left: 0.75rem; }
      `
      : `
        right: 0.25rem;
        @media (min-width: 640px) { right: 0.5rem; }
      `}

  &:hover {
    background-color: #f8f8f7;
    transform: translateY(-50%) scale(1.1);
  }

  @media (min-width: 640px) {
    height: 2.25rem;
    width: 2.25rem;
  }
`;

const CounterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.25rem 1.5rem 0.75rem;
  font-size: ${fontSize.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  color: ${meok[500]};

  @media (min-width: 640px) {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-bottom: 1rem;
  }
`;

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

  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  const handleCardClick = (story: SorimaruStoryItem) => {
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

    const targetLeft = getNearestCardScrollLeft(rail.scrollLeft, velocityRef.current);
    rail.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const scheduleRailIndicatorUpdate = useCallback(() => {
    if (indicatorFrameRef.current !== null) return;
    indicatorFrameRef.current = requestAnimationFrame(() => {
      indicatorFrameRef.current = null;
      const rail = railRef.current;
      if (!rail) return;
      const next = getRailIndicator(
        {
          scrollLeft: rail.scrollLeft,
          scrollWidth: rail.scrollWidth,
          clientWidth: rail.clientWidth,
        },
        stories.length
      );
      setRailIndicator((previous) => (shouldUpdateRailIndicator(previous, next) ? next : previous));
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
      <div style={{ borderRadius: '1rem', backgroundColor: '#f8f8f7', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: meok[700] }}>아직 주변 이야기를 찾지 못했어요.</p>
        <p style={{ marginTop: '0.25rem', fontSize: fontSize.micro, color: meok[500] }}>위치를 허용하면 가까운 오디오부터 보여드릴게요.</p>
      </div>
    );
  }

  return (
    <CarouselOuter aria-label="주변 오디오 목록">
      <div style={{ position: 'relative' }}>
        <ScrollTrack
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
          $isDragging={isDragging}
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
        </ScrollTrack>

        {railIndicator.left > 0.5 && <EdgeFadeLeft aria-hidden="true" />}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <EdgeFadeRight aria-hidden="true" />
        )}

        {railIndicator.left > 0.5 && (
          <FloatingNavBtn
            type="button"
            aria-label="이전 주변 오디오 보기"
            onClick={() => moveRail(-1)}
            $side="left"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </FloatingNavBtn>
        )}
        {railIndicator.width < 100 && railIndicator.left < 99 - railIndicator.width && (
          <FloatingNavBtn
            type="button"
            aria-label="다음 주변 오디오 보기"
            onClick={() => moveRail(1)}
            $side="right"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </FloatingNavBtn>
        )}
      </div>

      {railIndicator.width < 100 && (
        <CounterContainer aria-live="polite">
          <span style={{ fontFamily: 'monospace' }}>
            <strong style={{ fontWeight: 700, color: palette.jangmi[500] }}>
              {String(railIndicator.index).padStart(2, '0')}
            </strong>{' '}
            / {String(stories.length).padStart(2, '0')}
          </span>
        </CounterContainer>
      )}
    </CarouselOuter>
  );
};
