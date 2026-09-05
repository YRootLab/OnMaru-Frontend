'use client';

import styled from '@emotion/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { MODE_COLOR, useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

const MODES: { id: MapMode; label: string }[] = [
  { id: 'info', label: '정보' },
  { id: 'warmth', label: '온기' },
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
  height: ${({ $compact }) => ($compact ? '30px' : '34px')};
  padding: 2.5px;
  border-radius: 9999px;
  background: ${surface.light.card};
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
  user-select: none;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
`;

const SlidingPill = styled.div<{ $activeMode: MapMode; $compact?: boolean }>`
  position: absolute;
  top: 2.5px;
  bottom: 2.5px;
  left: 2.5px;
  width: calc(50% - 2.5px);
  border-radius: 9999px;
  background: ${({ $activeMode }) => MODE_COLOR[$activeMode]};
  transform: ${({ $activeMode }) =>
    $activeMode === 'warmth' ? 'translateX(100%)' : 'translateX(0%)'};
  transition:
    transform 0.28s cubic-bezier(0.25, 1, 0.5, 1),
    background 0.22s ease,
    box-shadow 0.22s ease;
  box-shadow: ${({ $activeMode }) =>
    $activeMode === 'warmth'
      ? '0 2px 8px rgba(255, 84, 20, 0.4)'
      : '0 2px 8px rgba(0, 184, 130, 0.4)'};
  z-index: 1;
  pointer-events: none;

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
  height: 100%;
  min-width: ${({ $compact }) => ($compact ? '42px' : '48px')};
  padding: ${({ $compact }) => ($compact ? '0 12px' : '0 15px')};
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: ${({ $compact }) => ($compact ? '12px' : '13px')};
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.18s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
    outline-offset: 2px;
  }
`;

export default function ModeToggle({ fullWidth, compact }: ModeToggleProps) {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);

  return (
    <Track role="tablist" aria-label="지도 모드" $fullWidth={fullWidth} $compact={compact}>
      {/* 부드럽게 미끄러지듯 이동하는 액티브 인디케이터 필 */}
      <SlidingPill $activeMode={mode} $compact={compact} />

      {MODES.map(({ id, label }) => (
        <Tab
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          $active={mode === id}
          $compact={compact}
          onClick={() => setMode(id)}
        >
          {label}
        </Tab>
      ))}
    </Track>
  );
}
