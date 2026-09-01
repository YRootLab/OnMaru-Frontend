'use client';

import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import { MODE_COLOR, useMapStore } from '../hooks/useMapStore';
import type { MapMode } from '../types';

const MODES: { id: MapMode; label: string }[] = [
  { id: 'info', label: '정보' },
  { id: 'warmth', label: '온기' },
];

const Track = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 36px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(78, 89, 104, 0.06);
`;

const Tab = styled.button<{ $active: boolean; $color: string }>`
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#FFFFFF' : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(25, 31, 40, 0.10)' : 'none')};
  color: ${({ $active, $color }) => ($active ? $color : meok[500])};
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease-out, color 0.2s ease-out, box-shadow 0.2s ease-out;

  &:focus-visible {
    outline: 2px solid ${({ $color }) => $color};
    outline-offset: 2px;
  }
`;

export default function ModeToggle() {
  const mode = useMapStore((s) => s.mode);
  const setMode = useMapStore((s) => s.setMode);

  return (
    <Track role="tablist" aria-label="지도 모드">
      {MODES.map(({ id, label }) => (
        <Tab
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          $active={mode === id}
          $color={MODE_COLOR[id]}
          onClick={() => setMode(id)}
        >
          {label}
        </Tab>
      ))}
    </Track>
  );
}
