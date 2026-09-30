'use client';

import React, { useRef, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useReducedMotion } from 'framer-motion';
import { meok, fontSize } from '@/design-system/tokens';

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
   * - 'sm': 130px (dialogs, compact sheets)
   * - 'md': 180px (standard place list / modal / feed)
   * - 'lg': 240px (full page empty archive grids)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Video source (defaults to '/videos/Oni_search.webm')
   */
  videoSrc?: string;
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
  padding: ${({ $compact }) => ($compact ? '20px 14px' : '40px 20px')};
  width: 100%;
  box-sizing: border-box;
`;

const MascotWrapper = styled.div<{ $size: 'sm' | 'md' | 'lg' }>`
  position: relative;
  width: ${({ $size }) => ($size === 'sm' ? '130px' : $size === 'lg' ? '240px' : '180px')};
  height: ${({ $size }) => ($size === 'sm' ? '130px' : $size === 'lg' ? '240px' : '180px')};
  margin-bottom: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;

  @media (max-width: 640px) {
    width: ${({ $size }) => ($size === 'sm' ? '110px' : $size === 'lg' ? '190px' : '150px')};
    height: ${({ $size }) => ($size === 'sm' ? '110px' : $size === 'lg' ? '190px' : '150px')};
  }
`;

const MascotVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
`;

const MascotStaticFallback = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
`;

const MainTitle = styled.h4`
  margin: 0 0 4px;
  font-family: var(--font-hanok, inherit);
  font-size: ${fontSize.base};
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
  line-height: 1.5;
  white-space: pre-line;
  word-break: keep-all;
  max-width: 100%;
  overflow-wrap: anywhere;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ActionWrapper = styled.div`
  margin-top: 12px;
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
  compact = false,
  className,
  role = 'status',
  'aria-live': ariaLive = 'polite',
  children,
}: OniSearchEmptyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, [prefersReducedMotion]);

  const sizePixels = size === 'sm' ? 130 : size === 'lg' ? 240 : 180;

  return (
    <EmptyContainer
      className={className}
      role={role}
      aria-live={ariaLive}
      $compact={compact}
    >
      <MascotWrapper $size={size} aria-hidden="true">
        {prefersReducedMotion || hasError ? (
          <MascotStaticFallback
            src="/images/character/Oni_tea.png"
            alt=""
            width={sizePixels}
            height={sizePixels}
          />
        ) : (
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
