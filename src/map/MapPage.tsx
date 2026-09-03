import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Home, ChevronLeft } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from './hooks/useMapStore';
import { useMapData } from './hooks/useMapData';
import BottomSheet from './components/BottomSheet';
import CategoryChips from './components/CategoryChips';
import DetailPanel from './components/DetailPanel';
import KakaoMap from './components/KakaoMap';
import ListPanel from './components/ListPanel';
import ModeToggle from './components/ModeToggle';
import PlaceMarkers from './components/PlaceMarkers';
import SearchBar from './components/SearchBar';
import WarmthLayer from './components/WarmthLayer';
import WriteButton from './components/warmth/WriteButton';
import MobileBottomNav from './components/MobileBottomNav';
import CinematicTourMapLayer from '@/features/cinematic-tour/components/CinematicTourMapLayer';
import CinematicTourFloatingBar from '@/features/cinematic-tour/components/CinematicTourFloatingBar';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

const Root = styled.main`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #ffffff;
  font-family: ${FONT};
`;

/** 1. 전체 화면을 시원하게 채우는 풀사이즈 지도 영역 */
const MapArea = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

/** 2. 호갱노노 스타일: 지도 위에 떠 있는 플로팅 듀얼 패널 컨테이너 (좌: 리스트, 우: 상세) */
const FloatingPanelsContainer = styled.div`
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 20;
  display: flex;
  align-items: stretch;
  gap: 12px;
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** PC에서 지도 위에 뜨는 카테고리 칩 */
const MapChips = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 10px;

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

  border-radius: 12px;
  background: #ffffff;

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
        <CinematicTourMapLayer />
        <MapChips>
          {!panelOpen && (
            <FloatingHomeButton
              type="button"
              onClick={handleBack}
              aria-label="온마루 메인 홈으로 이동"
              title="온마루 메인 홈으로 이동"
            >
              <ChevronLeft size={16} />
              <span>온마루 홈</span>
            </FloatingHomeButton>
          )}
          <CategoryChips />
        </MapChips>
        <WriteButton />
      </MapArea>

      {/* 2. 호갱노노 스타일: 지도 위에 떠 있는 좌측 리스트 + 우측 상세 플로팅 카드 */}
      <FloatingPanelsContainer>
        <ListPanel />
        <DetailPanel />
      </FloatingPanelsContainer>

      {/* 3. 모바일 탑 네비게이션 & 바텀시트 */}
      <MobileTop>
        <MobileSearchBarRow>
          <MobileBackButton
            type="button"
            onClick={handleBack}
            aria-label="온마루 메인으로 돌아가기"
            title="온마루 메인으로 돌아가기"
          >
            <ChevronLeft size={22} />
          </MobileBackButton>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchBar />
          </div>
        </MobileSearchBarRow>
        <ModeToggle />
      </MobileTop>

      {/* 4. 시네마틱 공간 오디오 투어 플로팅 컨트롤러 */}
      <CinematicTourFloatingBar />

      <BottomSheet />
      <MobileBottomNav />
    </Root>
  );
}

