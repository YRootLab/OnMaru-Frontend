'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGES } from './hanok.data';
import { useAnchaeScroll } from './useAnchaeScroll';
import { meok, surface } from '@/design-system/tokens';

const AnchaeViewerCanvas = dynamic(() => import('./AnchaeViewerCanvas'), {
  ssr: false,
  loading: () => <CanvasLoadingFallback />,
});

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ *
 * Emotion Styled Components (SpoqaHanSansNeo Full Font Integration)
 * ------------------------------------------------------------------ */

const CanvasLoadingFallback = styled.div`
  position: absolute;
  inset: 0;
  background: ${surface.dark.app};
`;

const ViewerContainer = styled.div<{ totalStages: number }>`
  height: ${(props) => props.totalStages * 100}vh;
  position: relative;
  background: ${surface.dark.app};
  font-family: 'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const StickyViewport = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  color: ${meok[100]};
`;

const VignetteOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(20, 23, 34, 0.96) 0%,
    rgba(20, 23, 34, 0.88) 28%,
    rgba(20, 23, 34, 0.55) 45%,
    rgba(20, 23, 34, 0) 68%
  );
  pointer-events: none;
  z-index: 10;

  @media (max-width: 768px) {
    background: linear-gradient(
      to top,
      rgba(14, 11, 7, 0.96) 0%,
      rgba(14, 11, 7, 0.72) 20%,
      rgba(14, 11, 7, 0.22) 35%,
      rgba(14, 11, 7, 0) 52%
    );
  }
`;

const EditorialPanel = styled.div`
  position: absolute;
  left: clamp(24px, 6vw, 96px);
  top: 50%;
  transform: translateY(-50%);
  width: clamp(340px, 42vw, 540px);
  z-index: 20;

  @media (max-width: 768px) {
    left: 20px;
    right: 20px;
    bottom: 48px;
    top: auto;
    transform: none;
    width: auto;
    max-width: calc(100vw - 40px);
  }
`;

const StageIndicatorGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 16px;
  }
`;

const StageIndicatorButton = styled.button<{ isActive: boolean }>`
  height: 4px;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 2px;
  background: transparent;
  width: ${(props) => (props.isActive ? '44px' : '16px')};
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 768px) {
    height: 3px;
    width: ${(props) => (props.isActive ? '28px' : '10px')};
  }
`;

const IndicatorSpan = styled(motion.span)`
  display: block;
  height: 100%;
  border-radius: 2px;
`;

/* SpoqaHanSansNeo 대형 디스플레이 타이틀 */
const OversizedTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  color: ${meok[100]};
  font-size: clamp(48px, 5.6vw, 76px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.045em;
  margin: 0 0 22px;
  display: flex;
  align-items: baseline;

  @media (max-width: 768px) {
    font-size: clamp(28px, 7.5vw, 36px);
    margin: 0 0 12px;
  }
`;

/* SpoqaHanSansNeo 메인 서체로 통일한 01, 02 숫자 접두사 */
const NumberPrefix = styled.span`
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  font-size: clamp(42px, 5vw, 68px);
  font-weight: 800;
  color: ${meok[100]};
  margin-right: 18px;
  letter-spacing: -0.03em;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: clamp(24px, 6.5vw, 30px);
    margin-right: 10px;
  }
`;

/* 살짝 크기를 줄여 한옥 모델과 조화를 이룬 정갈한 설명문 (15px ~ 17px) */
const StageDescription = styled.p`
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  font-size: clamp(15px, 1.5vw, 17px);
  line-height: 1.75;
  font-weight: 400;
  color: ${meok[400]};
  margin: 0;
  letter-spacing: -0.015em;

  @media (max-width: 768px) {
    font-size: 14px;
    line-height: 1.65;
  }
`;

const ScrollPrompt = styled(motion.div)`
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  font-size: 12px;
  letter-spacing: 0.24em;
  color: ${meok[400]};
  z-index: 20;
  pointer-events: none;

  @media (max-width: 768px) {
    bottom: 16px;
    font-size: 10px;
  }
`;

const ScrollBeamLine = styled(motion.span)`
  width: 1px;
  height: 26px;
  background: currentColor;
`;

/* ------------------------------------------------------------------ *
 * AnchaeViewer Main Component
 * ------------------------------------------------------------------ */

export default function AnchaeViewer() {
  const { progress, activeStage, containerRef, scrollToStage } = useAnchaeScroll();
  const stage = STAGES[activeStage] ?? STAGES[0];

  return (
    <ViewerContainer ref={containerRef} totalStages={STAGES.length}>
      <StickyViewport>
        <AnchaeViewerCanvas progress={progress} />

        <VignetteOverlay />

        <EditorialPanel>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.38, ease: EASE }}
            >
              {/* SpoqaHanSansNeo 폰트로 통일된 01, 02 인라인 타이틀 */}
              <OversizedTitle>
                <NumberPrefix>
                  {String(stage.step).padStart(2, '0')}
                </NumberPrefix>
                {stage.nameKo}
              </OversizedTitle>

              <StageDescription>{stage.desc}</StageDescription>
            </motion.div>
          </AnimatePresence>

          <StageIndicatorGroup>
            {STAGES.map((s, i) => {
              const isActive = i === activeStage;
              return (
                <StageIndicatorButton
                  key={s.id}
                  onClick={() => scrollToStage(i)}
                  aria-label={`${s.step}단계 ${s.nameKo}`}
                  aria-current={isActive}
                  isActive={isActive}
                >
                  <IndicatorSpan
                    animate={{
                      backgroundColor: isActive ? '#d4af37' : 'rgba(255,255,255,0.22)',
                    }}
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                </StageIndicatorButton>
              );
            })}
          </StageIndicatorGroup>
        </EditorialPanel>

        <AnimatePresence>
          {activeStage < STAGES.length - 1 && (
            <ScrollPrompt
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              SCROLL
              <ScrollBeamLine
                animate={{ y: [0, 7, 0], opacity: [0.7, 0.2, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.9, ease: 'easeInOut' }}
              />
            </ScrollPrompt>
          )}
        </AnimatePresence>
      </StickyViewport>
    </ViewerContainer>
  );
}
