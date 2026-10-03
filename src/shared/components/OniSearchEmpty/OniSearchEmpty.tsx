'use client';

import React, { useRef, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useReducedMotion } from 'framer-motion';
import { meok, fontSize } from '@/design-system/tokens';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';

export interface OniSearchEmptyProps {
  /**
   * Main title - MUST be placed at the very top of content hierarchy
   */
  title?: React.ReactNode;
  /**
   * Subtitle or secondary description - placed below title
   */
  description?: React.ReactNode;
  /**
   * Optional action button(s) or interactive elements
   */
  action?: React.ReactNode;
  /**
   * Mascot video size:
   * - 'sm': 160px (dialogs, compact sheets, small cards)
   * - 'md': 230px (standard place list / modal / feed)
   * - 'lg': 300px (full page empty archive grids, 404/error)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Video source (defaults to '/videos/Oni_search.webm')
   */
  videoSrc?: string;
  /**
   * Static fallback image source (defaults to '/images/character/Oni_tea.png')
   */
  imageSrc?: string;
  /**
   * Compact vertical padding
   */
  compact?: boolean;
  className?: string;
  role?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  children?: React.ReactNode;
}

const EmptyContainer = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ $compact }) => ($compact ? '12px 14px' : '24px 20px')};
  width: 100%;
  box-sizing: border-box;
`;

const MascotWrapper = styled.div<{ $size: 'sm' | 'md' | 'lg' }>`
  position: relative;
  width: ${({ $size }) => ($size === 'sm' ? '190px' : $size === 'lg' ? '360px' : '280px')};
  height: ${({ $size }) => ($size === 'sm' ? '190px' : $size === 'lg' ? '360px' : '280px')};
  margin-bottom: ${({ $size }) => ($size === 'sm' ? '-34px' : $size === 'lg' ? '-64px' : '-48px')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.16));

  @media (max-width: 640px) {
    width: ${({ $size }) => ($size === 'sm' ? '160px' : $size === 'lg' ? '300px' : '230px')};
    height: ${({ $size }) => ($size === 'sm' ? '160px' : $size === 'lg' ? '300px' : '230px')};
    margin-bottom: ${({ $size }) => ($size === 'sm' ? '-26px' : $size === 'lg' ? '-52px' : '-38px')};
  }
`;

const MascotImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.32);
  transform-origin: center center;
  pointer-events: none;
  user-select: none;
`;

const MascotVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.32);
  transform-origin: center center;
  pointer-events: none;
  user-select: none;

  [data-theme='dark'] & {
    mix-blend-mode: screen;
  }
`;

const MascotStaticFallback = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.32);
  transform-origin: center center;
  pointer-events: none;
  user-select: none;
`;

const MainTitle = styled.h4`
  margin: 0 0 4px;
  font-family: var(--font-hanok, inherit);
  font-size: ${fontSize.lg};
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
  word-break: keep-all;
  max-width: 100%;
  overflow-wrap: anywhere;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SubDescription = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 400;
  color: ${meok[600]};
  line-height: 1.45;
  white-space: pre-line;
  word-break: keep-all;
  max-width: 100%;
  overflow-wrap: anywhere;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ActionWrapper = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 240px;
`;

export function OniSearchEmpty({
  title,
  description,
  action,
  size = 'md',
  videoSrc = '/videos/Oni_search.webm',
  imageSrc = '/images/character/Oni_search.png',
  compact = false,
  className,
  role = 'status',
  'aria-live': ariaLive = 'polite',
  children,
}: OniSearchEmptyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isApple = useIsAppleDevice();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!videoSrc) return;
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    if (prefersReducedMotion) {
      video.pause?.();
    } else {
      const playPromise = video.play?.();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay may be deferred or blocked by browser power-saving mode
        });
      }
    }
  }, [prefersReducedMotion, videoSrc]);

  const sizePixels = size === 'sm' ? 190 : size === 'lg' ? 360 : 280;

  return (
    <EmptyContainer
      className={className}
      role={role}
      aria-live={ariaLive}
      $compact={compact}
    >
      <MascotWrapper $size={size} aria-hidden="true">
        {prefersReducedMotion ? (
          <MascotStaticFallback
            src={videoSrc ? '/images/character/Oni_tea.png' : imageSrc}
            alt=""
            width={sizePixels}
            height={sizePixels}
          />
        ) : isApple || hasError ? (
          <MascotImage
            src={imageSrc}
            alt=""
            width={sizePixels}
            height={sizePixels}
            onError={() => setHasError(true)}
          />
        ) : videoSrc ? (
          <MascotVideo
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => setHasError(true)}
            onCanPlay={(e) => {
              e.currentTarget.muted = true;
              const p = e.currentTarget.play?.();
              if (p && typeof p.catch === 'function') {
                p.catch(() => {});
              }
            }}
          >
            <source src={videoSrc} type="video/webm" onError={() => setHasError(true)} />
          </MascotVideo>
        ) : (
          <MascotImage
            src={imageSrc}
            alt=""
            width={sizePixels}
            height={sizePixels}
            onError={() => setHasError(true)}
          />
        )}
      </MascotWrapper>

      {title && <MainTitle>{title}</MainTitle>}
      {description && <SubDescription>{description}</SubDescription>}

      {action && <ActionWrapper>{action}</ActionWrapper>}
      {children}
    </EmptyContainer>
  );
}

export default OniSearchEmpty;
