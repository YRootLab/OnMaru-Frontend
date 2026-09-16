'use client';

import styled from '@emotion/styled';
import type { ScriptLine } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useTranscriptFollow } from './useTranscriptFollow';

interface PlayerTranscriptPanelProps {
  lines: readonly ScriptLine[];
  activeLineId: number | undefined;
  onSeek: (timeSec: number) => void;
  isLoading?: boolean;
}

const Panel = styled.section`
  position: relative;
  display: flex;
  min-height: 18rem;
  height: min(52vh, 38rem);
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.875rem;
  background: #f1f1ef;
  color: #292927;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84), 0 12px 28px rgba(17, 20, 20, 0.08);

  @media (min-width: 768px) {
    height: 100%;
    min-height: 32rem;
  }
`;

const LampHeader = styled.header`
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  padding: 1.25rem 1.25rem 1rem;
  background: #f8f8f7;
  border-bottom: 1px solid #d9d9d7;
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6f706d;
`;

const HeaderTitle = styled.h3`
  margin: 0.375rem 0 0;
  font-family: var(--font-hanok);
  font-size: 1.125rem;
  font-weight: 650;
  color: #292927;
`;

const Scroller = styled.div`
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  padding: 4.25rem 1.25rem;
  scrollbar-color: #cdcdca transparent;
`;

const Line = styled.button<{ $active: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 0.5rem;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  padding: 0.85rem 1rem 0.85rem 1.125rem;
  text-align: left;
  font-family: var(--font-hanok);
  font-size: 1.05rem;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  line-height: 1.72;
  color: #292927;
  opacity: ${({ $active }) => ($active ? 1 : 0.6)};
  cursor: pointer;
  transition: background-color 220ms ease, opacity 220ms ease, color 220ms ease;

  & + & {
    margin-top: 0.5rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0.8rem;
    bottom: 0.8rem;
    left: 0;
    width: 2px;
    border-radius: 999px;
    background: ${({ $active }) => ($active ? '#d4af37' : 'transparent')};
  }

  &:hover {
    background: #e5e5e3;
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid #6f706d;
    outline-offset: 2px;
  }

  @media (min-width: 768px) {
    font-size: 1.18rem;
    line-height: 1.78;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SkeletonLine = styled.div<{ $wide?: boolean }>`
  height: 1.3rem;
  width: ${({ $wide }) => ($wide ? '94%' : '72%')};
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #d9d9d7 25%, #e5e5e3 50%, #d9d9d7 75%);
  background-size: 200% 100%;
  animation: transcriptShimmer 1.7s ease-in-out infinite;

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
      <LampHeader>
        <Eyebrow>실시간 해설 대본</Eyebrow>
        <HeaderTitle>이야기를 준비하고 있어요</HeaderTitle>
      </LampHeader>
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
  isLoading = false,
}: PlayerTranscriptPanelProps) {
  const { activeLineRef, onTranscriptScroll, requestSeek } = useTranscriptFollow({ activeLineId, onSeek });

  if (isLoading) return <TranscriptSkeleton />;

  return (
    <Panel aria-label="실시간 해설 대본">
      <LampHeader>
        <Eyebrow>실시간 해설 대본</Eyebrow>
        <HeaderTitle>실시간 해설 대본</HeaderTitle>
      </LampHeader>
      <Scroller onScroll={onTranscriptScroll}>
        {lines.map((line) => {
          const isActive = line.id === activeLineId;
          return (
            <Line
              key={line.id}
              ref={isActive ? activeLineRef : undefined}
              type="button"
              aria-current={isActive}
              $active={isActive}
              onClick={() => requestSeek(line.timeSec)}
            >
              {line.text}
            </Line>
          );
        })}
      </Scroller>
    </Panel>
  );
}
