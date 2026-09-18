'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { ScriptLine } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useTranscriptFollow } from './useTranscriptFollow';

interface PlayerTranscriptPanelProps {
  lines: readonly ScriptLine[];
  activeLineId: number | undefined;
  onSeek: (timeSec: number) => void;
  imageUrl?: string;
  isLoading?: boolean;
  isPlaying?: boolean;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';

const Panel = styled.section`
  position: relative;
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: #f8f8f7;
  color: #292927;
  border-top: 1px solid #d9d9d7;
  border-radius: 1.25rem;
  isolation: isolate;

  [data-theme='dark'] & {
    background: #171513;
    color: #e5e5e3;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  @media (min-width: 768px) {
    min-height: 0;
    border-top: none;
  }
`;

const AmbientBackdrop = styled.div<{ $hasImage: boolean }>`
  position: absolute;
  inset: -30px;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.11;
  filter: blur(55px) saturate(1.3);
  transform: scale(1.15);
  transition: opacity 0.8s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  [data-theme='dark'] & {
    opacity: 0.15;
    filter: blur(65px) saturate(1.4);
  }
`;

const AmbientGradientWash = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 30%,
    rgba(212, 175, 55, 0.06) 0%,
    transparent 70%
  );

  [data-theme='dark'] & {
    background: radial-gradient(
      circle at 50% 30%,
      rgba(212, 175, 55, 0.08) 0%,
      transparent 70%
    );
  }
`;

const Scroller = styled.div`
  position: relative;
  z-index: 2;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  padding: 3rem 1.25rem 3.5rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 205, 202, 0.4) transparent;

  /* 상하단 시네마틱 페이드 마스크 */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(205, 205, 202, 0.45);
    border-radius: 9999px;
  }

  [data-theme='dark'] & {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    &::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.18);
    }
  }
`;

const LineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Line = styled.button<{
  $active: boolean;
  $distance: number;
}>`
  position: relative;
  display: block;
  width: 100%;
  margin: 0;
  border: 0;
  background: transparent;
  border-radius: 0.375rem;
  padding: 0.35rem 0.375rem;
  text-align: left;
  font-family: var(--font-hanok), -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  cursor: pointer;
  outline: none;

  /* Consistent Typography to eliminate abrupt size jumps / layout shifts */
  font-size: clamp(0.95rem, 1.1vw, 1.025rem);
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  line-height: 1.7;
  letter-spacing: -0.02em;

  /* Opacity-driven focus with subtle, gentle blur (no heavy muddy blur) */
  ${({ $active, $distance }) => {
    if ($active) {
      return `
        color: #171513;
        opacity: 1;
        filter: none;
      `;
    }
    if ($distance === 1) {
      return `
        color: #52504b;
        opacity: 0.62;
        filter: none;
      `;
    }
    return `
      color: #78756f;
      opacity: 0.35;
      filter: blur(0.4px);
    `;
  }}

  /* Dark mode */
  [data-theme='dark'] & {
    ${({ $active, $distance }) => {
      if ($active) {
        return `
          color: #ffffff;
          opacity: 1;
          filter: none;
        `;
      }
      if ($distance === 1) {
        return `
          color: #a8a59e;
          opacity: 0.62;
          filter: none;
        `;
      }
      return `
        color: #737069;
        opacity: 0.35;
        filter: blur(0.4px);
      `;
    }}
  }

  transition: opacity 220ms ease, color 220ms ease, filter 220ms ease, font-weight 220ms ease;

  /* 마우스 호버 시 부드럽게 unblur되어 텍스트 탐색 */
  &:hover {
    opacity: 0.95 !important;
    filter: blur(0px) !important;
    transform: scale(1) !important;
    color: #171513 !important;

    [data-theme='dark'] & {
      color: #ffffff !important;
    }
  }

  &:focus-visible {
    outline: 2px solid #d4af37;
    outline-offset: 2px;
    opacity: 1 !important;
    filter: blur(0px) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
    filter: none !important;
    transform: none !important;
    opacity: ${({ $active }) => ($active ? '1 !important' : '0.6 !important')};
  }
`;

const SkeletonLine = styled.div<{ $wide?: boolean }>`
  height: 1.3rem;
  width: ${({ $wide }) => ($wide ? '92%' : '68%')};
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #d9d9d7 25%, #e5e5e3 50%, #d9d9d7 75%);
  background-size: 200% 100%;
  animation: transcriptShimmer 1.7s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #24221f 25%, #2e2b27 50%, #24221f 75%);
    background-size: 200% 100%;
  }

  & + & {
    margin-top: 1.25rem;
  }

  @keyframes transcriptShimmer {
    to { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export function TranscriptSkeleton() {
  return (
    <Panel data-testid="transcript-skeleton" aria-label="대본 불러오는 중">
      <Scroller aria-hidden="true">
        <SkeletonLine $wide />
        <SkeletonLine />
        <SkeletonLine $wide />
        <SkeletonLine />
        <SkeletonLine $wide />
      </Scroller>
    </Panel>
  );
}

export function PlayerTranscriptPanel({
  lines,
  activeLineId,
  onSeek,
  imageUrl,
  isLoading = false,
  isPlaying = false,
}: PlayerTranscriptPanelProps) {
  const { activeLineRef, onTranscriptScroll, requestSeek } = useTranscriptFollow({ activeLineId, onSeek });
  const [imgError, setImgError] = useState(false);

  const activeIndex = useMemo(() => {
    if (activeLineId === undefined) return -1;
    return lines.findIndex((line) => line.id === activeLineId);
  }, [lines, activeLineId]);

  const effectiveBgImage = imgError || !imageUrl ? DEFAULT_FALLBACK_IMAGE : imageUrl;

  if (isLoading) return <TranscriptSkeleton />;

  return (
    <Panel aria-label="실시간 해설 대본">
      {/* 썸네일 기반 은은한 앰비언트 블러 백드롭 */}
      <AmbientBackdrop $hasImage={Boolean(effectiveBgImage)}>
        <img
          src={effectiveBgImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </AmbientBackdrop>
      <AmbientGradientWash />

      <Scroller onScroll={onTranscriptScroll} data-playing={isPlaying}>
        <LineList>
          {lines.map((line, index) => {
            const isActive = line.id === activeLineId;
            const distance = activeIndex >= 0 ? Math.abs(index - activeIndex) : 0;
            return (
              <Line
                key={line.id}
                ref={isActive ? activeLineRef : undefined}
                type="button"
                aria-current={isActive}
                $active={isActive}
                $distance={distance}
                onClick={() => requestSeek(line.timeSec)}
              >
                {line.text}
              </Line>
            );
          })}
        </LineList>
      </Scroller>
    </Panel>
  );
}
