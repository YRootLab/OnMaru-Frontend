'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { palette, ringShadow } from '@/design-system/tokens';
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
  padding: 12px;
`;

const LoaderCard = styled(motion.div)<{ $isCompleted?: boolean }>`
  width: 100%;
  max-width: 410px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  background: #f8f8f7;
  border-radius: 20px;
  padding: 20px 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: none;
  box-shadow: ${ringShadow.light.card};
  position: relative;
  transition: box-shadow 0.3s ease;

  [data-theme='dark'] & {
    background: #1c1a17;
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 400px) {
    padding: 16px 12px 14px;
    border-radius: 16px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  box-shadow: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #191f28;
    background: rgba(0, 0, 0, 0.06);

    [data-theme='dark'] & {
      color: #f3f4f6;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const StepBadge = styled(motion.div)<{ $isCompleted?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: ${({ $isCompleted }) =>
    $isCompleted ? 'rgba(0, 184, 130, 0.12)' : 'rgba(212, 175, 55, 0.12)'};
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: ${({ $isCompleted }) => ($isCompleted ? '#008a60' : '#b8941f')};
  font-size: 11.5px;
  font-weight: 600;
  margin-bottom: 6px;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
    background: ${({ $isCompleted }) =>
      $isCompleted ? 'rgba(0, 184, 130, 0.18)' : 'rgba(212, 175, 55, 0.16)'};
    color: ${({ $isCompleted }) => ($isCompleted ? '#4ade80' : '#e5c058')};
  }
`;

const Title = styled.h3`
  font-family: var(--font-hanok);
  font-size: 19px;
  font-weight: 500;
  color: #191f28;
  margin: 0 0 2px;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 10px;

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
            $isCompleted={hasCompleted}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <CloseButton onClick={handleClose} aria-label="닫기">
              <X size={16} />
            </CloseButton>

            <StepBadge
              $isCompleted={hasCompleted}
              animate={
                hasCompleted
                  ? {
                      scale: [1, 1.03, 1],
                      transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
                    }
                  : {}
              }
            >
              {hasCompleted ? (
                <CheckCircle2 size={13} />
              ) : (
                <Sparkles size={12} />
              )}
              <span>
                {hasCompleted
                  ? '여정 생성 완료'
                  : '일정을 만드는 중'}
              </span>
            </StepBadge>

            <Title>
              {gameMode === 'omok' ? '툇마루 오목 한 판' : '전통 낱말 찾기'}
            </Title>
            <Subtitle>
              {gameMode === 'omok'
                ? '일정을 준비하는 동안 가볍게 오목 한 판 즐겨보세요.'
                : '일정을 준비하는 동안 숨겨진 낱말을 찾아보세요.'}
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
