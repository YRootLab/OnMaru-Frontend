'use client';

import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import ModeToggle from './ModeToggle';
import PlaceList from './PlaceList';
import SearchBar from './SearchBar';
import WarmthFeed from './warmth/WarmthFeed';

const PANEL_WIDTH = 380;
const PANEL_WIDTH_COMPACT = 340;

/* ── 호갱노노 스타일: 지도 위에 떠 있는 둥근 플로팅 카드 ── */
const Panel = styled.aside<{ $open: boolean }>`
  position: relative;
  flex: none;
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0px')};
  height: 100%;
  background: #ffffff;
  border-radius: 24px;

  z-index: 21;
  pointer-events: auto;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.32, 0.72, 0, 1);

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${({ $open }) => ($open ? `${PANEL_WIDTH_COMPACT}px` : '0px')};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

const Inner = styled.div`
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
  gap: 10px;
  padding: 14px 16px 10px;
  background: #ffffff;
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(78, 89, 104, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 6px;
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
  background: #ffffff;

  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: ${meok[900]};
    background: #fafafa;
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

export default function ListPanel() {
  const panelOpen = useMapStore((s) => s.panelOpen);
  const togglePanel = useMapStore((s) => s.togglePanel);
  const mode = useMapStore((s) => s.mode);

  return (
    <Panel $open={panelOpen}>
      <Inner>
        {/* 1. 상단 2단 헤더: (1) 검색바 + (2) 모드 토글 */}
        <HeaderArea>
          <SearchBar />
          <ModeToggle />
        </HeaderArea>

        {/* 2. 메인 리스트 영역 (정보모드: PlaceList / 온기모드: WarmthFeed) */}
        <ListArea>
          {mode === 'warmth' ? <WarmthFeed /> : <PlaceList />}
        </ListArea>
      </Inner>

      <Toggle
        type="button"
        aria-expanded={panelOpen}
        aria-label={panelOpen ? '목록 패널 접기' : '목록 패널 펼치기'}
        onClick={togglePanel}
      >
        {panelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Toggle>
    </Panel>
  );
}
