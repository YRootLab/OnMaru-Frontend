'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, ChevronLeft } from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { meok, surface } from '@/design-system/tokens';
import {
  FLOATING_ENTER_DELAY_S,
  FLOATING_SPRING_TRANSITION,
  CATEGORY_ENTER_DELAY_S,
  CATEGORY_RISE_S,
} from '@/shared/navigation/mapEntranceTiming';
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
const FloatingPanelsContainer = styled(motion.div, transientProps)`
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

/** PC에서 지도 위에 뜨는 카테고리 칩 — 상세 패널 열리면 숨김.
 *  지도 진입 시에는 Header가 flip으로 사라지는 것과 같은 순간, 이 자리로
 *  아래에서 올라오며 나타나 마치 카드가 뒤집혀 교체되는 것처럼 보이게 한다. */
const MapChips = styled(motion.div, transientProps)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
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
    background: ${surface.light.card};
    color: ${meok[900]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const MobileTop = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 20;
  display: flex;
  align-items: center;

  @media (min-width: 1024px) {
    display: none;
  }
`;

export default function MapPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const panelOpen = useMapStore((s) => s.panelOpen);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);

  const isDetailOpen = Boolean(detailId) || popularPanelOpen;

  // MapChips는 진입 시 "맨 마지막에" 올라오는 연출과, 이후 상세 패널 열림에 따른
  // 평범한 숨김/노출 토글을 같은 애니메이션 prop으로 겸한다. 진입 지연은 최초 1회만
  // 필요하므로, 최초 등장이 끝나면 이후 토글에는 지연을 붙이지 않는다.
  const [hasEnteredCategory, setHasEnteredCategory] = useState(false);

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
        <MapChips
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: isDetailOpen ? 0 : 1, y: isDetailOpen ? -6 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: CATEGORY_RISE_S,
                  delay: hasEnteredCategory ? 0 : CATEGORY_ENTER_DELAY_S,
                  ease: 'easeOut',
                }
          }
          onAnimationComplete={() => setHasEnteredCategory(true)}
          style={{ pointerEvents: isDetailOpen ? 'none' : 'auto' }}
        >
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

        {/* 온기 모드에서만: 히트맵 범례 · 화면 요약 · 기간 창 */}
        <WarmthLegend />
      </MapArea>

      {/* 2. 네이버 지도 스타일: 좌측 고정 세로 네비게이션 레일 (GNB) */}
      <MapNavRail />

      {/* 3. 지도 위에 떠 있는 좌측 리스트 + 우측 상세 플로팅 카드 —
          좌측 레일 쪽에서 오른쪽으로, 레일이 자리 잡을 즈음 차분한 스프링으로 등장한다. */}
      <FloatingPanelsContainer
        initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { ...FLOATING_SPRING_TRANSITION, delay: FLOATING_ENTER_DELAY_S }
        }
      >
        <ListPanel />
        <DetailPanel />
      </FloatingPanelsContainer>

      {/* 3. 모바일 상단 모드 전환 (컴팩트 & 솔리드) */}
      <MobileTop>
        <ModeToggle compact />
      </MobileTop>

      {/* 4. 시네마틱 공간 오디오 투어 플로팅 컨트롤러 */}
      <CinematicTourFloatingBar />

      <BottomSheet />
    </Root>
  );
}

