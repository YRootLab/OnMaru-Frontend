'use client';

import React from 'react';
import styled from '@emotion/styled';
import { STAGES } from './hanok.data';
import { useHanokViewerStore } from '@/archive/hanok-viewer/store/useHanokViewerStore';


const DevContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  background: rgba(28, 26, 23, 0.95);
  border: 1px solid rgba(212, 175, 55, 0.4);
  backdrop-filter: blur(14px);
  border-radius: 14px;
  padding: 16px;
  width: 320px;
  color: #e0e6ed;
  font-family: monospace;
  font-size: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  user-select: none;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    width: calc(100vw - 20px);
    max-width: 300px;
    padding: 12px;
    font-size: 11px;
  }
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: bold;
  color: #d4af37;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  background: ${(props) => (props.active ? '#d4af37' : 'rgba(255,255,255,0.12)')};
  color: ${(props) => (props.active ? '#000' : '#fff')};
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Section = styled.div`
  margin-bottom: 12px;
`;

const SectionHeader = styled.div`
  font-size: 11px;
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 6px;
`;

const StageBtn = styled.button<{ isActive: boolean }>`
  background: ${(props) => (props.isActive ? '#d4af37' : 'rgba(255, 255, 255, 0.08)')};
  color: ${(props) => (props.isActive ? '#000' : '#ddd')};
  border: 1px solid ${(props) => (props.isActive ? '#d4af37' : 'rgba(255, 255, 255, 0.15)')};
  border-radius: 6px;
  padding: 6px 0;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.isActive ? '#e0bb43' : 'rgba(255, 255, 255, 0.2)')};
  }
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
          Pos: [{camPos.map((v) => v.toFixed(1)).join(', ')}]
        </div>
        <div style={{ color: '#ffb74d' }}>
          Target: [{camTarget.map((v) => v.toFixed(1)).join(', ')}] | FOV: {camFov.toFixed(1)}°
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