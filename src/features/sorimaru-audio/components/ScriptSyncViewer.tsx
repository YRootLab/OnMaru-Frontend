'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';
import { palette, meok } from '@/design-system/tokens';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const SectionCard = styled.section`
  border-radius: 1.5rem;
  background-color: #fbf8f2;
  padding: 1.5rem;

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
`;

const CategoryLabel = styled.p`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: ${palette.juhong[700]};
`;

const HeadingTitle = styled.h3`
  margin-top: 0.25rem;
  font-family: var(--font-hanok);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #211e19;
`;

const pulseDot = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const PlayingBadge = styled.span`
  margin-top: 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: ${palette.juhong[700]};
  padding: 0.25rem 0.625rem;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;

  span.dot {
    height: 6px;
    width: 6px;
    border-radius: 50%;
    background-color: #ffffff;
    animation: ${pulseDot} 1.5s infinite;
  }
`;

const BlockquoteArea = styled.blockquote`
  margin-top: 1.5rem;
  border-left: 2px solid ${palette.juhong[700]};
  padding-left: 1rem;
  font-family: var(--font-hanok);
  font-size: 14px;
  line-height: 1.75rem;
  color: #3c342a;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
`;

const ExcerptParagraph = styled.p<{ $active: boolean; $isFirst: boolean }>`
  ${({ $active }) =>
    $active
      ? `
        font-weight: 600;
        color: #211e19;
      `
      : `
        color: inherit;
      `}
  ${({ $isFirst }) => (!$isFirst ? 'margin-top: 0.5rem;' : '')}
`;

const FooterBar = styled.div`
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
`;

const MetaTimeSpan = styled.span`
  font-size: 0.75rem;
  color: #786d5e;

  span.count {
    margin-left: 0.5rem;
  }
`;

const ViewFullBtn = styled.button`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${palette.juhong[700]};
  text-decoration: underline;
  text-underline-offset: 4px;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: #7f3725;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  background-color: rgba(33, 30, 25, 0.5);
  padding: 0;
  backdrop-filter: blur(4px);

  @media (min-width: 640px) {
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
`;

const ModalContent = styled.div`
  display: flex;
  max-height: 86vh;
  width: 100%;
  max-width: 42rem;
  flex-direction: column;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  background-color: #fbf8f2;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);

  @media (min-width: 640px) {
    border-radius: 1.5rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(33, 30, 25, 0.08);

  @media (min-width: 640px) {
    padding: 1.25rem 2rem;
  }
`;

const CloseModalBtn = styled.button`
  border-radius: 9999px;
  padding: 0.5rem;
  color: #655b4d;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #eee6da;
    color: #211e19;
  }
`;

const ScrollListArea = styled.div`
  overflow-y: auto;
  padding: 1.25rem 1.5rem;

  @media (min-width: 640px) {
    padding: 1.25rem 2rem;
  }
`;

const TranscriptLine = styled.p<{ $active: boolean }>`
  cursor: pointer;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 14px;
  line-height: 1.75rem;
  transition: all 0.15s ease;

  @media (min-width: 640px) {
    font-size: 1rem;
  }

  ${({ $active }) =>
    $active
      ? `
        background-color: #f0ded5;
        font-weight: 600;
        color: #211e19;
      `
      : `
        color: #655b4d;
        &:hover {
          background-color: #f2ece2;
        }
      `}

  span.time {
    margin-right: 0.75rem;
    font-size: 0.75rem;
    font-family: monospace;
    color: ${palette.juhong[700]};
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  color: #786d5e;
  border-top: 1px solid rgba(33, 30, 25, 0.06);

  @media (min-width: 640px) {
    padding: 1rem 2rem;
  }
`;

export const ScriptSyncViewer: React.FC = () => {
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const activeScriptIndex = useSorimaruAudioStore((s) => s.activeScriptIndex);
  const parsedScriptLines = useSorimaruAudioStore((s) => s.parsedScriptLines);
  const { seekTo } = useSorimaruAudioPlayer();
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const activeItemRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (isTranscriptOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeScriptIndex, isTranscriptOpen]);

  if (!parsedScriptLines.length) return null;

  const previewStart = Math.max(0, Math.min(activeScriptIndex, parsedScriptLines.length - 3));
  const previewLines = parsedScriptLines.slice(previewStart, previewStart + 3);

  return (
    <>
      <SectionCard>
        <SectionHeader>
          <div>
            <CategoryLabel>NARRATIVE SCRIPT</CategoryLabel>
            <HeadingTitle>듣고 있는 이야기</HeadingTitle>
          </div>
          {isPlaying && (
            <PlayingBadge>
              <span className="dot" />
              재생 중
            </PlayingBadge>
          )}
        </SectionHeader>

        <BlockquoteArea>
          {previewLines.map((line, index) => (
            <ExcerptParagraph
              key={line.id}
              $active={line.id === parsedScriptLines[activeScriptIndex]?.id}
              $isFirst={index === 0}
            >
              {line.text}
            </ExcerptParagraph>
          ))}
        </BlockquoteArea>

        <FooterBar>
          <MetaTimeSpan>
            <span>{formatTime(parsedScriptLines[activeScriptIndex]?.timeSec ?? 0)}</span>
            <span className="count">대본 {parsedScriptLines.length}개 구간</span>
          </MetaTimeSpan>
          <ViewFullBtn type="button" onClick={() => setIsTranscriptOpen(true)}>
            대본 전체 보기 →
          </ViewFullBtn>
        </FooterBar>
      </SectionCard>

      {isTranscriptOpen && (
        <ModalOverlay role="dialog" aria-modal="true" aria-label="오디오 대본 전체 보기">
          <ModalContent>
            <ModalHeader>
              <div>
                <CategoryLabel>FULL TRANSCRIPT</CategoryLabel>
                <h3 style={{ marginTop: '0.25rem', fontFamily: 'var(--font-hanok)', fontSize: '1.25rem', fontWeight: 600 }}>
                  오디오 대본
                </h3>
              </div>
              <CloseModalBtn type="button" onClick={() => setIsTranscriptOpen(false)} aria-label="대본 닫기">
                ✕
              </CloseModalBtn>
            </ModalHeader>

            <ScrollListArea>
              {parsedScriptLines.map((line, index) => {
                const isActive = index === activeScriptIndex;
                return (
                  <TranscriptLine
                    key={line.id}
                    ref={isActive ? activeItemRef : null}
                    onClick={() => seekTo(line.timeSec)}
                    $active={isActive}
                  >
                    <span className="time">{formatTime(line.timeSec)}</span>
                    {line.text}
                  </TranscriptLine>
                );
              })}
            </ScrollListArea>

            <ModalFooter>
              문장을 누르면 해당 오디오 구간으로 이동합니다.
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};
