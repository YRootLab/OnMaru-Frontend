'use client';

import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { ArrowLeft } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from './hooks/useMapStore';
import BottomSheet from './components/BottomSheet';
import CategoryChips from './components/CategoryChips';
import KakaoMap from './components/KakaoMap';
import ListPanel from './components/ListPanel';
import ModeToggle from './components/ModeToggle';
import SearchBar from './components/SearchBar';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * 지도는 전역 PageContainer의 여백 밖에서 화면을 통째로 쓴다.
 * (fixed inset 0 — 기존 /map 프로토타입과 같은 방식)
 */
const Root = styled.main`
  position: fixed;
  inset: 0;
  display: flex;
  overflow: hidden;
  background: #ffffff;
  font-family: ${FONT};
`;

const MapArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

/** PC에서만 지도 위에 뜨는 카테고리 칩. 모바일은 바텀시트 안에 있다. */
const MapChips = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 패널이 닫혔을 때 지도 좌상단에 뜨는 홈/뒤로가기 플로팅 버튼 */
const FloatingHomeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px 0 10px;
  border: 1px solid rgba(78, 89, 104, 0.12);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.08);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease-out;

  &:hover {
    background: #ffffff;
    color: ${meok[900]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const MobileTop = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const MobileSearchBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MobileBackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: none;
  border: 1px solid rgba(78, 89, 104, 0.14);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.06);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.04);
    color: ${meok[900]};
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default function MapPage() {
  const router = useRouter();
  const panelOpen = useMapStore((s) => s.panelOpen);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Root>
      <ListPanel />

      <MapArea>
        <KakaoMap />
        <MapChips>
          {!panelOpen && (
            <FloatingHomeButton
              type="button"
              onClick={handleBack}
              aria-label="이전 페이지 또는 홈으로 이동"
            >
              <ArrowLeft size={16} />
              <span>홈으로</span>
            </FloatingHomeButton>
          )}
          <CategoryChips />
        </MapChips>
      </MapArea>

      <MobileTop>
        <MobileSearchBarRow>
          <MobileBackButton
            type="button"
            onClick={handleBack}
            aria-label="이전 페이지 또는 홈으로 이동"
          >
            <ArrowLeft size={20} />
          </MobileBackButton>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchBar />
          </div>
        </MobileSearchBarRow>
        <ModeToggle />
      </MobileTop>

      <BottomSheet />
    </Root>
  );
}
