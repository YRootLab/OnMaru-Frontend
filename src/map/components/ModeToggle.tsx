'use client';

import styled from '@emotion/styled';
import { meok, surface } from '@/design-system/tokens';
import { MODE_COLOR, useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

const MODES: { id: MapMode; label: string }[] = [
  { id: 'info', label: '정보' },
  { id: 'warmth', label: '온기' },
];

const Track = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 38px;
  padding: 3px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
`;

const Tab = styled.button<{ $active: boolean; $color: string }>`

  border-radius: 9999px;
  background: ${({ $active }) => ($active ? surface.light.card : 'transparent')};

  color: ${({ $active, $color }) => ($active ? $color : meok[700])};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

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
