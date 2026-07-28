'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { STAGES } from '../../data/hanok.data';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';

interface DevCameraHelperProps {
  onJumpStage?: (stageIndex: number) => void;
}

const DevContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  background: rgba(28, 26, 23, 0.94);
  border: 1px solid rgba(212, 175, 55, 0.35);
  backdrop-filter: blur(14px);
  border-radius: 12px;
  padding: 16px;
  width: 330px;
  color: #e0e6ed;
  font-family: monospace;
  font-size: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  user-select: none;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    width: calc(100vw - 20px);
    max-width: 310px;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
  color: #d4af37;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  background: ${(props) => (props.active ? '#d4af37' : 'rgba(255,255,255,0.1)')};
  color: ${(props) => (props.active ? '#000' : '#fff')};
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Section = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.div`
  font-size: 10px;
  color: #8a99ad;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
`;

const ValueBox = styled.div<{ copied?: boolean }>`
  background: rgba(0, 0, 0, 0.4);
  border: 1px dashed ${(props) => (props.copied ? '#4caf50' : 'rgba(255, 255, 255, 0.2)')};
  border-radius: 6px;
  padding: 8px 10px;
  color: ${(props) => (props.copied ? '#4caf50' : '#64b5f6')};
  cursor: pointer;
  transition: all 0.2s;
  word-break: break-all;

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
  }
`;

const SliderGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 6px;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
`;

const SliderLabel = styled.span`
  width: 16px;
  font-weight: bold;
  color: #d4af37;
`;

const SliderInput = styled.input`
  flex: 1;
  accent-color: #d4af37;
  cursor: pointer;
`;

const SliderValue = styled.span`
  width: 38px;
  text-align: right;
  color: #90caf9;
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 12px;
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

const ToastNotice = styled.span`
  color: #4caf50;
  font-size: 10px;
`;

export default function DevCameraHelper({ onJumpStage }: DevCameraHelperProps) {
  const {
    camPos,
    camTarget,
    camFov,
    activeStageIndex,
    isOrbitEnabled,
    customTarget,
    setIsOrbitEnabled,
    setCustomTarget,
  } = useHanokViewerStore();

  const [copiedType, setCopiedType] = useState<'pos' | 'target' | null>(null);

  const displayTarget = customTarget ?? camTarget;
  const formattedPos = `[${camPos.map((v) => Number(v.toFixed(2))).join(', ')}]`;
  const formattedTarget = `[${displayTarget.map((v) => Number(v.toFixed(2))).join(', ')}]`;

  const copyToClipboard = (text: string, type: 'pos' | 'target') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const handleSliderChange = (axisIndex: 0 | 1 | 2, value: number) => {
    const nextTarget: [number, number, number] = [...displayTarget];
    nextTarget[axisIndex] = value;
    setCustomTarget(nextTarget);
  };

  return (
    <DevContainer>
      <TitleBar>
        <span>🇰🇷 DEV CAMERA TOOL</span>
        <ToggleButton active={isOrbitEnabled} onClick={() => setIsOrbitEnabled(!isOrbitEnabled)}>
          {isOrbitEnabled ? 'Orbit ON' : 'Orbit OFF'}
        </ToggleButton>
      </TitleBar>

      <Section>
        <Label>
          <span>cameraPos</span>
          {copiedType === 'pos' && <ToastNotice>복사됨!</ToastNotice>}
        </Label>
        <ValueBox copied={copiedType === 'pos'} onClick={() => copyToClipboard(formattedPos, 'pos')}>
          {formattedPos}
        </ValueBox>
      </Section>

      <Section>
        <Label>
          <span>cameraTarget (클릭하여 복사)</span>
          {copiedType === 'target' && <ToastNotice>복사됨!</ToastNotice>}
        </Label>
        <ValueBox copied={copiedType === 'target'} onClick={() => copyToClipboard(formattedTarget, 'target')}>
          {formattedTarget}
        </ValueBox>

        <SliderGroup>
          <SliderRow>
            <SliderLabel>X</SliderLabel>
            <SliderInput
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={displayTarget[0]}
              onChange={(e) => handleSliderChange(0, parseFloat(e.target.value))}
            />
            <SliderValue>{displayTarget[0].toFixed(1)}</SliderValue>
          </SliderRow>
          <SliderRow>
            <SliderLabel>Y</SliderLabel>
            <SliderInput
              type="range"
              min="0"
              max="12"
              step="0.1"
              value={displayTarget[1]}
              onChange={(e) => handleSliderChange(1, parseFloat(e.target.value))}
            />
            <SliderValue>{displayTarget[1].toFixed(1)}</SliderValue>
          </SliderRow>
          <SliderRow>
            <SliderLabel>Z</SliderLabel>
            <SliderInput
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={displayTarget[2]}
              onChange={(e) => handleSliderChange(2, parseFloat(e.target.value))}
            />
            <SliderValue>{displayTarget[2].toFixed(1)}</SliderValue>
          </SliderRow>
        </SliderGroup>
      </Section>

      <Section>
        <Label>
          <span>FOV</span>
        </Label>
        <div style={{ color: '#ffb74d', fontWeight: 'bold' }}>{camFov.toFixed(1)}°</div>
      </Section>

      <Label style={{ marginTop: '12px' }}>STAGE JUMP (1 ~ 7)</Label>
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
