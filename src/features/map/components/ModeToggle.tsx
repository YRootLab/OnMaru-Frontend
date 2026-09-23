'use client';

import styled from '@emotion/styled';
import { Landmark, Flame } from 'lucide-react';
import { lightPalette, meok, palette } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { MapMode } from '@/features/map/types';

interface ModeOption {
  id: MapMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const MODES: ModeOption[] = [
  { id: 'info', label: '정보', icon: Landmark },
  { id: 'warmth', label: '온기', icon: Flame },
];

interface ModeToggleProps {
  fullWidth?: boolean;
  compact?: boolean;
}

const Track = styled.div<{ $fullWidth?: boolean; $compact?: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? 'grid' : 'inline-grid')};
  grid-template-columns: 1fr 1fr;
  align-items: center;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  height: ${({ $compact }) => ($compact ? '36px' : '40px')};
  padding: 3px;
  border-radius: 12px;
  background: rgba(25, 31, 40, 0.06);
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
  border-radius: 9px;
  background: #ffffff;
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
  border-radius: 9px;
  background: transparent;
  color: ${({ $active }) => ($active ? meok[900] : meok[500])};
  font-family: inherit;
  font-size: ${({ $compact }) => ($compact ? '12.5px' : '13.5px')};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  letter-spacing: -0.015em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    transform 0.15s ease;

  &:hover {
    color: ${({ $active }) => ($active ? meok[900] : meok[700])};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};

    &:hover {
      color: #ffffff;
    }
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
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
        ? palette.hwanggeum[500]
        : palette.kobalt[500]
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

export default function ModeToggle({ fullWidth, compact }: ModeToggleProps) {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);

  return (
    <Track role="tablist" aria-label="지도 모드" $fullWidth={fullWidth} $compact={compact}>
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
              <IconComponent size={compact ? 13 : 15} strokeWidth={2} />
            </IconWrap>
            <span>{label}</span>
          </Tab>
        );
      })}
    </Track>
  );
}
