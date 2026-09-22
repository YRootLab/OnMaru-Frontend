'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { palette, meok, fontSize } from '@/design-system/tokens';
import { Compass, Maximize2, Minimize2, RotateCw, MapPin, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioReactiveAura } from './AudioReactiveAura';

interface SorimaruRoadviewProps {
  mapX?: string;
  mapY?: string;
  fallbackImage?: string;
  title?: string;
  isExpanded?: boolean;
  analyserRef?: React.RefObject<AnalyserNode | null>;
  isPlaying?: boolean;
}

const Container = styled.div<{ $isFullscreen?: boolean }>`
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  border-radius: 1.25rem;
  overflow: hidden;
  position: relative;
  background-color: #1c1a17;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.25);
  transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const FallbackContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const FallbackImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: kenburns 20s infinite alternate ease-in-out;

  @keyframes kenburns {
    0% {
      transform: scale(1) translate(0, 0);
    }
    100% {
      transform: scale(1.12) translate(-1.5%, -1%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const RoadviewCanvas = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  z-index: 1;
`;

const VignetteOverlay = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 2;
  background: radial-gradient(circle at center, transparent 45%, rgba(14, 16, 22, 0.6) 100%),
    linear-gradient(to top, rgba(14, 16, 22, 0.8) 0%, transparent 40%);
`;

const TopBadgeBar = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
`;

const StatusChip = styled.div<{ $status?: 'live' | 'photo' | 'loading' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(20, 22, 28, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ $status }) =>
      $status === 'live' ? '#22c55e' : $status === 'photo' ? '#f59e0b' : '#9ca3af'};
    box-shadow: 0 0 8px
      ${({ $status }) =>
        $status === 'live'
          ? 'rgba(34, 197, 94, 0.8)'
          : $status === 'photo'
          ? 'rgba(245, 158, 11, 0.8)'
          : 'rgba(156, 163, 175, 0.5)'};
    animation: ${({ $status }) => ($status === 'loading' ? 'pulseDot 1.5s infinite ease-in-out' : 'none')};
  }

  @keyframes pulseDot {
    0%, 100% { opacity: 0.3; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1.15); }
  }
`;

const SkeletonOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #d9d9d7 25%, #e5e5e3 50%, #d9d9d7 75%);
  background-size: 200% 100%;
  animation: roadviewSkeletonShimmer 1.8s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #1f1d1a 25%, #2a2723 50%, #1f1d1a 75%);
    background-size: 200% 100%;
  }

  @keyframes roadviewSkeletonShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SkeletonBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #57534e;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);

  [data-theme='dark'] & {
    background: rgba(20, 18, 16, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #a8a29e;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .spin-icon {
    animation: roadviewSpin 2s linear infinite;
    color: ${palette.juhong[500]};

    [data-theme='dark'] & {
      color: ${palette.juhong[400]};
    }
  }

  @keyframes roadviewSpin {
    to { transform: rotate(360deg); }
  }
`;

const ControlButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  pointer-events: auto;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: rgba(20, 22, 28, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(36, 40, 50, 0.9);
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const DragGuidanceBadge = styled(motion.div)`
  position: absolute;
  bottom: 0.875rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: rgba(14, 16, 22, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 85, 0, 0.35);
  color: #f5f5f4;
  font-size: 0.7rem;
  font-weight: 500;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  white-space: nowrap;

  svg {
    color: ${palette.juhong[400]};
  }
`;

export const SorimaruRoadview: React.FC<SorimaruRoadviewProps> = ({
  mapX,
  mapY,
  fallbackImage,
  title,
  analyserRef,
  isPlaying = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const roadviewInstanceRef = useRef<any>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const initRoadview = useCallback(() => {
    const lat = parseFloat(mapY || '');
    const lng = parseFloat(mapX || '');

    if (isNaN(lat) || isNaN(lng) || !containerRef.current) {
      setError(true);
      return;
    }

    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps) {
      setError(true);
      return;
    }

    kakao.maps.load(() => {
      try {
        if (!containerRef.current) return;
        const roadview = new kakao.maps.Roadview(containerRef.current);
        const roadviewClient = new kakao.maps.RoadviewClient();
        const position = new kakao.maps.LatLng(lat, lng);

        roadviewClient.getNearestPanoId(position, 500, (panoId: number | null) => {
          if (panoId === null) {
            setError(true);
          } else {
            roadview.setPanoId(panoId, position);
            roadviewInstanceRef.current = roadview;
            setLoaded(true);
            setError(false);

            setTimeout(() => setShowGuide(false), 5000);
          }
        });
      } catch (err) {
        console.error('[SorimaruRoadview] Initialization error', err);
        setError(true);
      }
    });
  }, [mapX, mapY]);

  useEffect(() => {
    setError(false);
    setLoaded(false);
    setIsImgLoaded(false);
    setShowGuide(true);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = window.setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      setError((hasLoadedError) => hasLoadedError || !roadviewInstanceRef.current);
    }, 6000);

    const checkSdkAndInit = () => {
      if ((window as any).kakao?.maps) {
        initRoadview();
      } else {
        intervalId = setInterval(() => {
          if ((window as any).kakao?.maps) {
            clearInterval(intervalId);
            initRoadview();
          }
        }, 300);
      }
    };

    checkSdkAndInit();
    return () => {
      if (intervalId) clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [initRoadview, fallbackImage]);

  useEffect(() => {
    const canvas = containerRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => roadviewInstanceRef.current?.relayout?.());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (roadviewInstanceRef.current?.relayout) {
          roadviewInstanceRef.current.relayout();
        }
      }, 350);
      return next;
    });
  };

  const handleResetAngle = () => {
    if (roadviewInstanceRef.current?.setViewpoint) {
      roadviewInstanceRef.current.setViewpoint({ pan: 0, tilt: 0, zoom: 0 });
    }
  };

  const retryRoadview = () => {
    roadviewInstanceRef.current = null;
    setError(false);
    setLoaded(false);
    setShowGuide(true);
    initRoadview();
  };

  const hasCoordinates = Boolean(
    mapX && mapY && !isNaN(parseFloat(mapX)) && !isNaN(parseFloat(mapY))
  );

  const isTargetingRoadview = hasCoordinates && !error;
  const isVisualReady = isTargetingRoadview ? loaded : isImgLoaded;

  const statusType: 'live' | 'photo' | 'loading' = loaded
    ? 'live'
    : error || !hasCoordinates
    ? isImgLoaded
      ? 'photo'
      : 'loading'
    : 'loading';

  return (
    <Container $isFullscreen={isFullscreen}>
      {}
      <RoadviewCanvas
        ref={containerRef}
        style={{
          display: error || !hasCoordinates ? 'none' : 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />

      {analyserRef && <AudioReactiveAura analyserRef={analyserRef} isPlaying={isPlaying} />}

      {}
      {(!isTargetingRoadview || error) && fallbackImage && (
        <FallbackContainer>
          <FallbackImg
            src={fallbackImage}
            alt={title || '한옥 현장 뷰'}
            loading="eager"
            referrerPolicy="no-referrer"
            onLoad={() => setIsImgLoaded(true)}
            onError={() => setIsImgLoaded(true)}
          />
        </FallbackContainer>
      )}

      {}
      <AnimatePresence>
        {!isVisualReady && (
          <SkeletonOverlay
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <SkeletonBadge>
              <Compass size={14} className="spin-icon" />
              <span>{isTargetingRoadview ? '360° 현장 뷰 로딩 중...' : '현장 사진 불러오는 중...'}</span>
            </SkeletonBadge>
          </SkeletonOverlay>
        )}
      </AnimatePresence>

      {}
      <VignetteOverlay />

      {}
      <TopBadgeBar>
        <StatusChip $status={statusType}>
          <span className="dot" />
          <span>
            {statusType === 'live'
              ? '현장 사진 뷰어'
              : statusType === 'photo'
              ? '현장 사진 뷰어'
              : '현장 뷰 로딩 중'}
          </span>
        </StatusChip>

        <ButtonGroup>
          {error && (
            <IconButton type="button" onClick={retryRoadview} title="현장 뷰 다시 불러오기" aria-label="현장 뷰 다시 불러오기">
              <RefreshCw size={13} strokeWidth={2} />
            </IconButton>
          )}
          {loaded && (
            <IconButton type="button" onClick={handleResetAngle} title="시점 초기화" aria-label="시점 초기화">
              <RotateCw size={13} strokeWidth={2} />
            </IconButton>
          )}
          <IconButton
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? '기본 화면' : '시야 확장'}
            aria-label={isFullscreen ? '기본 화면' : '시야 확장'}
          >
            {isFullscreen ? <Minimize2 size={13} strokeWidth={2} /> : <Maximize2 size={13} strokeWidth={2} />}
          </IconButton>
        </ButtonGroup>
      </TopBadgeBar>

      {}
      <AnimatePresence>
        {loaded && showGuide && (
          <DragGuidanceBadge
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Compass size={14} className="animate-spin" />
            <span>화면을 드래그하여 주변 360°를 둘러보세요</span>
          </DragGuidanceBadge>
        )}
      </AnimatePresence>
    </Container>
  );
};

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  pointer-events: auto;
`;
