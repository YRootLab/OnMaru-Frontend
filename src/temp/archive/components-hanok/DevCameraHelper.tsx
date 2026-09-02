'use client';

import React from 'react';
import styled from '@emotion/styled';
import { STAGES } from './hanok.data';
import { useHanokViewerStore } from '@/temp/archive/hanok-viewer/store/useHanokViewerStore';

const DevContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  background: rgba(28, 26, 23, 0.95);
  border-radius: 12px;
  padding: 16px;
  color: #f5f5f7;
  font-family: monospace;
  font-size: 12px;
  width: 320px;
`;

const TitleBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #d4af37;
  font-weight: bold;
`;

const ToggleButton = styled.button<{ active?: boolean }>`
  background: ${(props) => (props.active ? '#d4af37' : 'rgba(255, 255, 255, 0.1)')};
  color: ${(props) => (props.active ? '#1c1a17' : '#fff')};
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
`;

const SectionHeader = styled.div`
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Section = styled.div`
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 6px;
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
`;

const StageBtn = styled.button<{ isActive?: boolean }>`
  background: ${(props) => (props.isActive ? '#d4af37' : 'rgba(255, 255, 255, 0.1)')};
  color: ${(props) => (props.isActive ? '#1c1a17' : '#fff')};
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
`;

// 개발자 툴 화면 표시 여부 플래그 (코드 유지 및 화면 비노출 처리)
const SHOW_DEV_TOOL = false;

interface DevCameraHelperProps {
  onJumpStage?: (stageIndex: number) => void;
}

export default function DevCameraHelper({ onJumpStage }: DevCameraHelperProps) {
  const {
    isOrbitEnabled,
    setIsOrbitEnabled,
    camPos,
    camTarget,
    camFov,
    activeStageIndex,
  } = useHanokViewerStore();

  if (!SHOW_DEV_TOOL) return null;

  return (
    <DevContainer>
      <TitleBar>
        <span>🇰🇷 DEV CAMERA TOOL</span>
        <ToggleButton active={isOrbitEnabled} onClick={() => setIsOrbitEnabled(!isOrbitEnabled)}>
          {isOrbitEnabled ? 'Orbit ON' : 'Orbit OFF'}
        </ToggleButton>
      </TitleBar>

      <Section>
        <SectionHeader>
          <span>📷 Camera Position / Target</span>
        </SectionHeader>
        <div style={{ color: '#64b5f6', marginBottom: '4px' }}>
          Pos: [{camPos.map((v: number) => v.toFixed(1)).join(', ')}]
        </div>
        <div style={{ color: '#ffb74d' }}>
          Target: [{camTarget.map((v: number) => v.toFixed(1)).join(', ')}] | FOV: {camFov.toFixed(1)}°
        </div>
      </Section>

      <SectionHeader>STAGE JUMP (1 ~ 7)</SectionHeader>
      <StageGrid>
        {STAGES.map((s, idx) => (
          <StageBtn
            key={s.id}
            isActive={idx === activeStageIndex}
            onClick={() => onJumpStage?.(idx)}
            title={s.nameKo}
          >
            {s.step}. {s.nameKo}
          </StageBtn>
        ))}
      </StageGrid>
    </DevContainer>
  );
}