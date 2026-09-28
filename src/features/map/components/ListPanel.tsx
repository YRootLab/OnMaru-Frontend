'use client';

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { meok, surface, ringShadow } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import ModeToggle from './ModeToggle';
import PlaceList from './PlaceList';
import SearchBar from './SearchBar';
import WarmthFeed from '@/private/core-ui/map-warmth/WarmthFeed';

const PANEL_WIDTH = 400;
const PANEL_WIDTH_COMPACT = 358;


const Panel = styled.aside<{ $open: boolean; $mounted: boolean }>`
  position: relative;
  flex: none;
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0px')};
  height: 100%;
  background: ${surface.light.card};
  border-radius: 24px;

  z-index: 21;
  pointer-events: auto;
  overflow: hidden;
  transition: ${({ $mounted }) => ($mounted ? 'width 0.28s cubic-bezier(0.32, 0.72, 0, 1)' : 'none')};

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: ${ringShadow.dark.mapPanel};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${({ $open }) => ($open ? `${PANEL_WIDTH_COMPACT}px` : '0px')};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

const Inner = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${PANEL_WIDTH}px;
  height: 100%;
  overflow: hidden;

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${PANEL_WIDTH_COMPACT}px;
  }
`;

const HeaderArea = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 14px 14px 12px;
  background: ${surface.light.card};
  border-bottom: 1px solid rgba(25, 31, 40, 0.06);
  z-index: 10;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const ModeToggleContainer = styled.div`
  margin-top: 8px;
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 60px;
  scrollbar-width: thin;
  scrollbar-color: rgba(78, 89, 104, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(78, 89, 104, 0.2);
    border-radius: 9999px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(78, 89, 104, 0.35);
  }
`;

const BottomFadeGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.7) 45%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 15;

  [data-theme='dark'] & {
    background: linear-gradient(to top, rgba(45, 41, 36, 0.98) 0%, rgba(45, 41, 36, 0.7) 45%, rgba(45, 41, 36, 0) 100%);
  }
`;

const Toggle = styled.button`
  position: absolute;
  top: 50%;
  left: 100%;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  transform: translateY(-50%);

  border-radius: 0 16px 16px 0;
  background: ${surface.light.card};

  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: ${meok[900]};
    background: ${surface.light.card};
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-left: none;

    &:hover {
      color: #ffffff;
      background: ${surface.dark.card};
    }
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

export default function ListPanel() {
  const panelOpen = useMapStore((s) => s.panelOpen);
  const togglePanel = useMapStore((s) => s.togglePanel);
  const mode = useMapStore((s) => s.mode);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Panel $open={panelOpen} $mounted={mounted}>
      <Inner>
        {}
        <HeaderArea>
          <SearchBar />
          <ModeToggleContainer>
            <ModeToggle fullWidth />
          </ModeToggleContainer>
        </HeaderArea>

        {}
        <ListArea>
          {mode === 'warmth' ? (
            <WarmthFeed />
          ) : (
            <PlaceList />
          )}
        </ListArea>

        {}
        <BottomFadeGradient aria-hidden="true" />
      </Inner>

      <Toggle
        type="button"
        aria-expanded={panelOpen}
        aria-label={panelOpen ? '목록 패널 접기' : '목록 패널 펼치기'}
        onClick={togglePanel}
      >
        {panelOpen ? <ChevronLeft size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
      </Toggle>
    </Panel>
  );
}
