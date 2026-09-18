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
  seamless?: boolean;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';

const Panel = styled.section<{ $seamless?: boolean }>`
  position: relative;
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  color: #292927;
  border: none;
  isolation: isolate;

  [data-theme='dark'] & {
    background: transparent;
    color: #e5e5e3;
    border: none;
  }

  @media (min-width: 768px) {
    min-height: 0;
  }
`;

const TopGradientFade = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.25rem;
  background: linear-gradient(to bottom, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 5;

  [data-theme='dark'] & {
    background: linear-gradient(to bottom, #1c1a17 0%, rgba(28, 26, 23, 0) 100%);
  }
`;

const BottomGradientFade = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5rem;
  background: linear-gradient(to top, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 5;

  [data-theme='dark'] & {
    background: linear-gradient(to top, #1c1a17 0%, rgba(28, 26, 23, 0) 100%);
  }
`;

const Scroller = styled.div<{ $seamless?: boolean }>`
  position: relative;
  z-index: 2;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  padding: ${({ $seamless }) => ($seamless ? '0.35rem 0.4rem 0.6rem' : '1.25rem 1rem 1.5rem')};
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 205, 202, 0.4) transparent;

  /* 상하단 시네마틱 페이드 마스크 (Top & Bottom Linear Gradient) */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 14%,
    black 86%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 14%,
    black 86%,
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
  gap: 0.35rem;
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
  border-radius: 0.5rem;
  padding: 0.35rem 0.5rem;
  text-align: left;
  font-family: var(--font-hanok), -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  cursor: pointer;
  outline: none;

  /* Consistent Typography to eliminate abrupt size jumps / layout shifts */
  font-size: clamp(0.925rem, 1.05vw, 1rem);
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  line-height: 1.6;
  letter-spacing: -0.02em;

  /* Opacity-driven focus (자연스럽고 편안한 가독성) */
  ${({ $active, $distance }) => {
    if ($active) {
      return `
        color: #171513;
        opacity: 1;
        font-weight: 700;
        filter: none;
      `;
    }
    if ($distance === 1) {
      return `
        color: #3b3834;
        opacity: 0.82;
        font-weight: 500;
        filter: none;
      `;
    }
    return `
      color: #5e5b56;
      opacity: 0.62;
      font-weight: 400;
      filter: none;
    `;
  }}

  /* Dark mode */
  [data-theme='dark'] & {
    ${({ $active, $distance }) => {
      if ($active) {
        return `
          color: #ffffff;
          opacity: 1;
          font-weight: 700;
          filter: none;
        `;
      }
      if ($distance === 1) {
        return `
          color: #e0deda;
          opacity: 0.85;
          font-weight: 500;
          filter: none;
        `;
      }
      return `
        color: #a8a49c;
        opacity: 0.65;
        font-weight: 400;
        filter: none;
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

export function TranscriptSkeleton({ seamless = false }: { seamless?: boolean }) {
  return (
    <Panel data-testid="transcript-skeleton" aria-label="대본 불러오는 중" $seamless={seamless}>
      <Scroller aria-hidden="true" $seamless={seamless}>
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
  seamless = false,
}: PlayerTranscriptPanelProps) {
  const { activeLineRef, onTranscriptScroll, requestSeek } = useTranscriptFollow({ activeLineId, onSeek });
  const [imgError, setImgError] = useState(false);

  const activeIndex = useMemo(() => {
    if (activeLineId === undefined) return -1;
    return lines.findIndex((line) => line.id === activeLineId);
  }, [lines, activeLineId]);

  const effectiveBgImage = imgError || !imageUrl ? DEFAULT_FALLBACK_IMAGE : imageUrl;

  if (isLoading) return <TranscriptSkeleton seamless={seamless} />;

  return (
    <Panel aria-label="실시간 해설 대본" $seamless={seamless}>
      <TopGradientFade />

      <Scroller onScroll={onTranscriptScroll} data-playing={isPlaying} $seamless={seamless}>
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

      <BottomGradientFade />
    </Panel>
  );
}
