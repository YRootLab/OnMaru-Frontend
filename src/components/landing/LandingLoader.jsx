'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import styled from '@emotion/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';

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
 * - 완료 시 0.5초 Fade-out 이행
 */
export default function LandingLoader() {
  const { active, progress } = useProgress();
  const [isDone, setIsDone] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!active && progress >= 100) {
      const timer1 = setTimeout(() => setIsDone(true), 200);
      const timer2 = setTimeout(() => setIsHidden(true), 700);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setIsDone(false);
      setIsHidden(false);
    }
  }, [active, progress]);

  if (isHidden) return null;

  const displayPercent = Math.min(100, Math.round(progress));

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
