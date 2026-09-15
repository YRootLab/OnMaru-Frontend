'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useJourneyStore } from '../store/useJourneyStore';
import MiniOmokGame from './MiniOmokGame';
import TraditionalWordSearch from './TraditionalWordSearch';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 16, 22, 0.78);
  backdrop-filter: blur(14px);
  padding: 16px;
`;

const LoaderCard = styled(motion.div)`
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 24px;
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
  overflow: hidden;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #f3f4f6;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StepBadge = styled.div<{ $isCompleted?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 9999px;
  background: ${({ $isCompleted }) =>
    $isCompleted ? 'rgba(0, 184, 130, 0.12)' : 'rgba(212, 175, 55, 0.12)'};
  border: 1px solid
    ${({ $isCompleted }) =>
      $isCompleted ? 'rgba(0, 184, 130, 0.3)' : 'rgba(212, 175, 55, 0.3)'};
  color: ${({ $isCompleted }) => ($isCompleted ? '#00b882' : '#d4af37')};
  font-size: 11.5px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  font-family: var(--font-hanok);
  font-size: 22px;
  font-weight: 500;
  color: #191f28;
  margin: 0 0 4px;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const Subtitle = styled.p`
  font-size: 12.5px;
  color: #6b7280;
  margin: 0 0 16px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

export default function JourneyAssemblyLoader() {
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const [gameMode, setGameMode] = useState<'omok' | 'wordsearch'>('omok');
  const [userDismissed, setUserDismissed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Sync completion state: 사용자가 여정 탐색(생성)을 실제로 시작했을 때만 동작
  useEffect(() => {
    if (isGenerating) {
      setHasStarted(true);
      setHasCompleted(false);
      setUserDismissed(false);
      setGameMode('omok');
    } else if (hasStarted) {
      setHasCompleted(true);
    }
  }, [isGenerating, hasStarted]);

  const handleClose = () => {
    setUserDismissed(true);
    setHasStarted(false);
  };

  const isVisible = hasStarted && !userDismissed;

  return (
    <AnimatePresence>
      {isVisible && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
        <LoaderCard
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <CloseButton onClick={handleClose} aria-label="닫기">
            <X size={18} />
          </CloseButton>

          <StepBadge $isCompleted={hasCompleted}>
            <Sparkles size={12} />
            <span>{hasCompleted ? '여정 추천이 끝났어요!' : '맞춤 여정을 찾는 중이에요'}</span>
          </StepBadge>

          <Title>
            {gameMode === 'omok' ? '툇마루 오목 한 판' : '전통 낱말 찾기'}
          </Title>
          <Subtitle>
            {gameMode === 'omok'
              ? '여정을 준비하는 동안 가볍게 오목 한 판 즐겨보세요.'
              : '여정을 준비하는 동안 숨겨진 전통 낱말을 찾아보세요.'}
          </Subtitle>

          {gameMode === 'omok' ? (
            <MiniOmokGame
              isGenerationComplete={hasCompleted}
              onViewJourney={handleClose}
              onGoToWordSearch={() => setGameMode('wordsearch')}
            />
          ) : (
            <TraditionalWordSearch
              isGenerationComplete={hasCompleted}
              onViewJourney={handleClose}
              onBackToOmok={() => setGameMode('omok')}
            />
          )}
        </LoaderCard>
      </Overlay>
      )}
    </AnimatePresence>
  );
}
