'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import styled from '@emotion/styled';
import { logger } from '@/lib/log';
import { lightPalette, meok, surface } from '@/design-system/tokens';

const log = logger('landing');

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${surface.light.base};
  opacity: ${(props) => (props.isDone ? 0 : 1)};
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out;
  pointer-events: ${(props) => (props.isDone ? 'none' : 'auto')};
  user-select: none;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 360px;
  width: 90%;
  text-align: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${meok[800]};
`;

const ProgressTrack = styled.div`
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  background: rgba(28, 26, 23, 0.08);
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${(props) => props.progress}%;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    ${lightPalette.juhong[400]} 0%,
    ${lightPalette.juhong[500]} 50%,
    ${lightPalette.hwanggeum[500]} 100%
  );
  box-shadow: 0 0 12px ${lightPalette.juhong[400]};
  transition: width 0.3s ease-out;
`;

const Percent = styled.span`
  font-size: 13px;
  font-weight: 700;
  font-family: monospace, sans-serif;
  color: ${lightPalette.juhong[500]};
  letter-spacing: 0.05em;
`;

/**
 * 3D 자원 로딩 전용 커스텀 프로그레스 스크린 (LandingLoader)
 * - useProgress 훅으로 active, progress(0~100) 추적
 * - 캐시되었거나 즉시 로드 완료 시 안전 타임아웃(Safety Fallback)으로 자동 해제
 * - 완료 시 0.5초 Fade-out 이행
 */
export default function LandingLoader() {
  const { active, progress, loaded, total } = useProgress();
  const [isDone, setIsDone] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);

  // 시각적 게이지 부드러운 증가
  useEffect(() => {
    if (progress > visualProgress) {
      setVisualProgress(progress);
    }
  }, [progress, visualProgress]);

  useEffect(() => {
    // 1. 정상적으로 100% 로드 완료된 경우
    const isCompleted = (!active && progress >= 100) || (!active && loaded > 0 && loaded >= total);

    log.log('progress', { active, progress: Math.round(progress), loaded, total, isCompleted });

    if (isCompleted) {
      setVisualProgress(100);
      const timer1 = setTimeout(() => setIsDone(true), 200);
      const timer2 = setTimeout(() => setIsHidden(true), 700);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    // 2. 초기 로드 시 점진적 게이지 증가 및 안전 타임아웃 (최대 1.8초)
    const interval = setInterval(() => {
      setVisualProgress((prev) => {
        if (prev < 90) return prev + Math.floor(Math.random() * 15) + 8;
        return prev;
      });
    }, 120);

    const fallbackTimer = setTimeout(() => {
      log.warn('1.8초 안전 타임아웃으로 강제 해제 — 3D 자원이 안 끝났다', { active, loaded, total });
      clearInterval(interval);
      setVisualProgress(100);
      setIsDone(true);
      setTimeout(() => setIsHidden(true), 500);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [active, progress, loaded, total]);

  if (isHidden) return null;

  const displayPercent = Math.min(100, Math.round(visualProgress));

  return (
    <Overlay isDone={isDone} isHidden={isHidden} aria-label="3D 자원 로딩 스크린">
      <Content>
        <Title>한옥의 볕과 결을 불러오는 중...</Title>
        <ProgressTrack>
          <ProgressBar progress={displayPercent} />
        </ProgressTrack>
        <Percent>{displayPercent}%</Percent>
      </Content>
    </Overlay>
  );
}
