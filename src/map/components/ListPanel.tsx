'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '../hooks/useMapStore';
import ModeToggle from './ModeToggle';
import RegionChips from './RegionChips';
import SearchBar from './SearchBar';

const PANEL_WIDTH = 380;

const PanelTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 4px;
`;

const BackToHomeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 8px;
  border: 1px solid rgba(78, 89, 104, 0.14);
  border-radius: 20px;
  background: rgba(25, 31, 40, 0.04);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;

  svg {
    transition: transform 0.18s ease;
  }

  &:hover {
    background: rgba(25, 31, 40, 0.08);
    color: ${meok[900]};
    transform: translateY(-1px);

    svg {
      transform: translateX(-2px);
    }
  }

  &:active {
    transform: scale(0.97);
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  opacity: 0.9;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

/** 리스트 아이템은 다음 단계. 지금은 자리만 잡아둔다. */
export const ListPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  margin: 16px;
  border: 1px dashed rgba(78, 89, 104, 0.24);
  border-radius: 12px;
  color: ${meok[400]};
  font-size: 13px;
`;

const Panel = styled.aside<{ $open: boolean }>`
  position: relative;
  flex: none;
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0px')};
  border-right: 1px solid rgba(78, 89, 104, 0.1);
  background: #ffffff;
  transition: width 0.3s ease-out;

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
`;

const Row = styled.div<{ $pad: string }>`
  flex: none;
  padding: ${({ $pad }) => $pad};
`;

const Divider = styled.hr`
  flex: none;
  margin: 0;
  border: none;
  border-top: 1px solid rgba(78, 89, 104, 0.1);
`;

const ListHeader = styled.p`
  flex: none;
  margin: 0;
  padding: 12px 16px 0;
  font-size: 13px;
  color: ${meok[500]};
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const Toggle = styled.button`
  position: absolute;
  top: 50%;
  left: 100%;
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  transform: translateY(-50%);
  border: none;
  border-radius: 0 12px 12px 0;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(25, 31, 40, 0.12);
  color: ${meok[700]};
  cursor: pointer;

  @media (max-width: 1023px) {
    display: none;
  }
`;

export default function ListPanel() {
  const router = useRouter();
  const panelOpen = useMapStore((s) => s.panelOpen);
  const togglePanel = useMapStore((s) => s.togglePanel);
  const mode = useMapStore((s) => s.mode);
  const count = useMapStore((s) => s.items.length);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Panel $open={panelOpen}>
      <Inner>
        <PanelTopBar>
          <BackToHomeButton
            type="button"
            onClick={handleBack}
            aria-label="이전 페이지 또는 홈으로 이동"
          >
            <ArrowLeft size={16} />
            <span>뒤로가기</span>
          </BackToHomeButton>
          <LogoLink href="/" aria-label="온마루 홈으로 이동">
            <Image
              src="/logo.png"
              alt="온마루 로고"
              width={84}
              height={25}
              style={{ objectFit: 'contain', height: '24px', width: 'auto' }}
              priority
            />
          </LogoLink>
        </PanelTopBar>

        <Row $pad="10px 16px 14px">
          <SearchBar />
        </Row>
        <Row $pad="0 16px 12px">
          <ModeToggle />
        </Row>
        <Row $pad="0 16px 12px">
          <RegionChips />
        </Row>
        <Divider />
        <ListHeader>
          {mode === 'info' ? '명소' : '온기'} {count}곳
        </ListHeader>
        <ListArea>
          <ListPlaceholder>리스트 영역 · 다음 단계</ListPlaceholder>
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
