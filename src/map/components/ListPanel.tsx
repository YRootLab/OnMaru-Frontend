'use client';

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import ModeToggle from './ModeToggle';
import PlaceList from './PlaceList';
import SearchBar from './SearchBar';
import WarmthFeed from './warmth/WarmthFeed';

const PANEL_WIDTH = 400;
const PANEL_WIDTH_COMPACT = 358;

/* ── 호갱노노 스타일: 지도 위에 떠 있는 둥근 플로팅 카드 ── */
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
  /* 스크롤되는 리스트 위에 항상 고정된 "유틸리티 존"이라는 걸 옅은 경계로
     드러낸다 — 검색바/토글과 그 아래 피드가 그냥 이어붙은 것처럼 밋밋해
     보이지 않도록. */
  border-bottom: 1px solid rgba(25, 31, 40, 0.06);
  z-index: 10;
`;

const ModeToggleContainer = styled.div`
  margin-top: 8px;
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* 하단 BottomFadeGradient(48px)가 항상 떠 있어서, 목록이 짧으면(예: 검색
     결과 1곳) 마지막 아이템이 그 흰 그라데이션에 가려 잘려 보인다. 스크롤로
     그라데이션을 벗어날 수 있도록 그 높이보다 넉넉한 여백을 항상 확보한다. */
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
        {/* 1. 상단 2단 헤더: (1) 검색바 + (2) 모드 토글 [정보 | 온기] */}
        <HeaderArea>
          <SearchBar />
          <ModeToggleContainer>
            <ModeToggle fullWidth />
          </ModeToggleContainer>
        </HeaderArea>

        {/* 2. 메인 리스트 영역 (정보모드: PlaceList / 온기모드: WarmthFeed) */}
        <ListArea>
          {mode === 'warmth' ? <WarmthFeed /> : <PlaceList />}
        </ListArea>

        {/* 3. 하단 세로 페이드 그라데이션 */}
        <BottomFadeGradient aria-hidden="true" />
      </Inner>

      <Toggle
        type="button"
        aria-expanded={panelOpen}
        aria-label={panelOpen ? '목록 패널 접기' : '목록 패널 펼치기'}
        onClick={togglePanel}
      >
        {panelOpen ? <IoChevronBackOutline size={16} /> : <IoChevronForwardOutline size={16} />}
      </Toggle>
    </Panel>
  );
}
