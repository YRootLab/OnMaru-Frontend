'use client';

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Landmark, Flame } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { MODE_COLOR, useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

interface ModeOption {
  id: MapMode;
  label: string;
  icon: typeof Landmark;
}

const MODES: ModeOption[] = [
  { id: 'info', label: '정보', icon: Landmark },
  { id: 'warmth', label: '온기', icon: Flame },
];

interface ModeToggleProps {
  fullWidth?: boolean;
  compact?: boolean;
}

const pulseAnim = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.45;
  }
`;

const Track = styled.div<{ $fullWidth?: boolean; $compact?: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? 'grid' : 'inline-grid')};
  grid-template-columns: 1fr 1fr;
  align-items: center;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  height: ${({ $compact }) => ($compact ? '34px' : '38px')};
  padding: 3px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.05);
  border: none;
  box-shadow: none;
  user-select: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SlidingPill = styled.div<{ $activeMode: MapMode; $compact?: boolean }>`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  border-radius: 9999px;
  background: #ffffff;
  border: none;
  box-shadow: none;
  transform: ${({ $activeMode }) =>
    $activeMode === 'warmth' ? 'translateX(100%)' : 'translateX(0%)'};
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1;
  pointer-events: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.16);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Tab = styled.button<{ $active: boolean; $compact?: boolean }>`
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  min-width: ${({ $compact }) => ($compact ? '48px' : '56px')};
  padding: ${({ $compact }) => ($compact ? '0 12px' : '0 16px')};
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: ${({ $active }) => ($active ? '#191f28' : meok[500])};
  font-family: inherit;
  font-size: ${({ $compact }) => ($compact ? '12.5px' : '13.5px')};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  letter-spacing: -0.015em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    transform 0.15s ease;

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  }

  &:hover {
    color: ${({ $active }) => ($active ? '#191f28' : meok[900])};
    [data-theme='dark'] & {
      color: #ffffff;
    }
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
    outline-offset: 2px;
  }
`;

const IconWrap = styled.span<{ $mode: MapMode; $active: boolean; $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $mode, $active }) =>
    $active
      ? $mode === 'warmth'
        ? lightPalette.juhong[500]
        : lightPalette.cheongrok[500]
      : 'currentColor'};
  transform: ${({ $active }) => ($active ? 'scale(1.05)' : 'scale(0.95)')};
  transition:
    color 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  svg {
    width: ${({ $compact }) => ($compact ? '13px' : '15px')};
    height: ${({ $compact }) => ($compact ? '13px' : '15px')};
  }
`;

const LivePulseDot = styled.span<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${lightPalette.juhong[500]};
  margin-left: -2px;

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${lightPalette.juhong[500]};
    animation: ${pulseAnim} 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    pointer-events: none;
    opacity: ${({ $active }) => ($active ? 1 : 0)};
  }
`;

export default function ModeToggle({ fullWidth, compact }: ModeToggleProps) {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);

  return (
    <Track role="tablist" aria-label="지도 모드" $fullWidth={fullWidth} $compact={compact}>
      {/* 부드럽게 미끄러지듯 이동하는 순수 면 분할 화이트 인디케이터 (No Shadow, No Border) */}
      <SlidingPill $activeMode={mode} $compact={compact} />

      {MODES.map(({ id, label, icon: IconComponent }) => {
        const isActive = mode === id;
        return (
          <Tab
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            $active={isActive}
            $compact={compact}
            onClick={() => setMode(id)}
          >
            <IconWrap $mode={id} $active={isActive} $compact={compact}>
              <IconComponent strokeWidth={isActive ? 2.2 : 1.8} />
            </IconWrap>
            <span>{label}</span>
            {id === 'warmth' && isActive && <LivePulseDot $active={isActive} />}
          </Tab>
        );
      })}
    </Track>
  );
}
