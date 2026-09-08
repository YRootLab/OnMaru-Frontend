'use client';

import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { IoChevronBackOutline } from 'react-icons/io5';
import { meok, surface } from '@/design-system/tokens';
import { useMapStore } from './hooks/useMapStore';
import { useMapData } from './hooks/useMapData';
import BottomSheet from './components/BottomSheet';
import CategoryChips from './components/CategoryChips';
import DetailPanel from './components/DetailPanel';
import KakaoMap from './components/KakaoMap';
import ListPanel from './components/ListPanel';
import ModeToggle from './components/ModeToggle';
import PlaceMarkers from './components/PlaceMarkers';
import WarmthLayer from './components/WarmthLayer';
import WarmthNotesLayer from './components/warmth/WarmthNotesLayer';
import WriteButton from './components/warmth/WriteButton';
import WarmthLegend from './components/warmth/WarmthLegend';
import MobileBottomNav from './components/MobileBottomNav';
import MapNavRail from './components/MapNavRail';
import CinematicTourMapLayer from '@/features/cinematic-tour/components/CinematicTourMapLayer';
import CinematicTourFloatingBar from '@/features/cinematic-tour/components/CinematicTourFloatingBar';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

const Root = styled.main`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: ${surface.light.card};
  font-family: ${FONT};
`;

/** 1. 전체 화면을 시원하게 채우는 풀사이즈 지도 영역 */
const MapArea = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

/** 2. 플로팅 듀얼 패널 컨테이너 (좌측 68px 네비게이션 레일 옆 80px에 배치) */
const FloatingPanelsContainer = styled.div`
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 80px;
  z-index: 20;
  display: flex;
  align-items: stretch;
  gap: 12px;
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** PC에서 지도 위에 뜨는 카테고리 칩 — 상세 패널 열리면 숨김 */
const MapChips = styled.div<{ $hidden: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;

  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  transform: ${({ $hidden }) => ($hidden ? 'translateY(-6px)' : 'translateY(0)')};
  transition: opacity 0.22s ease, transform 0.22s ease;

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 패널이 닫혔을 때 좌상단에 뜨는 홈 버튼 */
const FloatingHomeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px 0 10px;

  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);

  color: ${meok[700]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease-out;

  &:hover {
    background: ${surface.light.card};
    color: ${meok[900]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const MobileTopBar = styled.div<{ $hidden: boolean }>`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;

  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transform: ${({ $hidden }) => ($hidden ? 'translateY(-6px)' : 'translateY(0)')};
  transition: opacity 0.22s ease, transform 0.22s ease;

  @media (min-width: 1024px) {
    display: none;
  }

  & > * {
    pointer-events: auto;
  }
`;

const MobileModeToggleWrapper = styled.div`
  flex-shrink: 0;
`;

const MobileChipsScroller = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

export default function MapPage() {
  const router = useRouter();
  const panelOpen = useMapStore((s) => s.panelOpen);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);

  const isDetailOpen = Boolean(detailId) || popularPanelOpen;

  // 지도 데이터(TourAPI 장소 + 온기 데이터) 패치 훅
  useMapData();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Root>
      {/* 1. 풀스크린 지도 뷰포트 */}
      <MapArea>
        <KakaoMap />
        <PlaceMarkers />
        <WarmthLayer />
        <WarmthNotesLayer />
        <CinematicTourMapLayer />
        <MapChips $hidden={isDetailOpen}>
          {!panelOpen && (
            <FloatingHomeButton
              type="button"
              onClick={handleBack}
              aria-label="온마루 메인 홈으로 이동"
              title="온마루 메인 홈으로 이동"
            >
              <IoChevronBackOutline size={16} />
              <span>온마루 홈</span>
            </FloatingHomeButton>
          )}
          <CategoryChips />
        </MapChips>
        <WriteButton />

        {/* 온기 모드에서만: 히트맵 범례 · 화면 요약 · 기간 창 */}
        <WarmthLegend />
      </MapArea>

      {/* 2. 네이버 지도 스타일: 좌측 고정 세로 네비게이션 레일 (GNB) */}
      <MapNavRail />

      {/* 3. 지도 위에 떠 있는 좌측 리스트 + 우측 상세 플로팅 카드 */}
      <FloatingPanelsContainer>
        <ListPanel />
        <DetailPanel />
      </FloatingPanelsContainer>

      {/* 3. 모바일 상단 헤더: 모드 전환(정보/온기) + 가로 스크롤 카테고리 칩셋 */}
      <MobileTopBar $hidden={isDetailOpen}>
        <MobileModeToggleWrapper>
          <ModeToggle compact />
        </MobileModeToggleWrapper>
        <MobileChipsScroller>
          <CategoryChips />
        </MobileChipsScroller>
      </MobileTopBar>

      {/* 4. 시네마틱 공간 오디오 투어 플로팅 컨트롤러 */}
      <CinematicTourFloatingBar />

      <BottomSheet />
      <MobileBottomNav />
    </Root>
  );
}

