'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { transientProps } from '@/design-system/styled';
import { meok, surface } from '@/design-system/tokens';
import {
  FLOATING_ENTER_DELAY_S,
  FLOATING_SPRING_TRANSITION,
  CATEGORY_ENTER_DELAY_S,
  CATEGORY_SPRING_TRANSITION,
} from '@/shared/navigation/mapEntranceTiming';
import { useMapEntranceStore } from '@/shared/navigation/mapEntranceState';
import { useMapStore } from './hooks/useMapStore';
import { useMapData } from './hooks/useMapData';
import BottomSheet from './components/BottomSheet';
import CategoryChips from './components/CategoryChips';
import DetailPanel from './components/DetailPanel';
import KakaoMap from './components/KakaoMap';
import ListPanel from './components/ListPanel';
import PlaceMarkers from './components/PlaceMarkers';
import WarmthLayer from './components/WarmthLayer';
import WarmthNotesLayer from './components/warmth/WarmthNotesLayer';
import WriteButton from './components/warmth/WriteButton';
import WarmthLegend from './components/warmth/WarmthLegend';
import MapNavRail, { RAIL_INSET, RAIL_WIDTH } from './components/MapNavRail';
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

/** 2. 플로팅 듀얼 패널 컨테이너 — 얇아진 좌측 레일(MapNavRail) 옆에 같은 14px
 *  마진 리듬으로 배치한다. */
const FloatingPanelsContainer = styled(motion.div, transientProps)`
  position: absolute;
  top: ${RAIL_INSET}px;
  bottom: ${RAIL_INSET}px;
  left: ${RAIL_INSET + RAIL_WIDTH + RAIL_INSET}px;
  z-index: 20;
  display: flex;
  align-items: stretch;
  gap: 12px;
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** PC에서 지도 위에 뜨는 카테고리 칩 — 상세 패널 열리면 숨김. 모바일은 아래
 *  MobileTopBar/MobileChipsScroller가 별도로 담당한다(레이아웃이 다르므로
 *  이 컴포넌트를 그대로 재사용하면 두 UI가 겹친다).
 *  지도 진입 시에는 Header가 사라지는 것과 같은 순간, 이 자리로 아래에서
 *  떠오르며 나타나 "그 자리를 이어받는" 느낌을 낸다.
 *  top/height는 왼쪽 ListPanel 안 검색바(HeaderArea 14px 패딩 + 44px 높이 필드)의
 *  세로 중심과 정확히 같은 y좌표에 오도록 맞춘다 — 패널의 검색바와 지도 위
 *  카테고리가 같은 가로줄에 나란히 놓여야 하나의 "상단 유틸리티 바"처럼 읽힌다.
 *  left까지 잡아서 폭을 뷰포트 기준으로 고정해야 CategoryChips가 "실제로
 *  쓸 수 있는 폭"을 측정할 수 있다 — 그 폭만큼의 빈 영역은 지도 클릭을
 *  가려선 안 되므로 컨테이너 자체는 pointer-events: none, 실제 버튼들만
 *  auto로 되돌린다. */
const MapChips = styled(motion.div, transientProps)<{ $interactive: boolean }>`
  position: absolute;
  top: ${RAIL_INSET + 14}px;
  right: ${RAIL_INSET}px;
  left: ${RAIL_INSET}px;
  height: 44px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  pointer-events: none;

  & > * {
    pointer-events: ${({ $interactive }) => ($interactive ? 'auto' : 'none')};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

/** 패널이 닫혔을 때 좌상단에 뜨는 홈 버튼 */
const FloatingHomeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 13px 0 9px;

  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(25, 31, 40, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  color: ${meok[700]};
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #ffffff;
    color: ${meok[900]};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: scale(0.96);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      background: rgba(30, 32, 38, 0.92);
      border-color: rgba(255, 255, 255, 0.1);
      color: ${meok[200]};
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);

      &:hover {
        background: rgba(45, 48, 56, 0.95);
        color: #ffffff;
      }
    }
  }

  [data-theme='dark'] & {
    background: rgba(30, 32, 38, 0.92);
    border-color: rgba(255, 255, 255, 0.1);
    color: ${meok[200]};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);

    &:hover {
      background: rgba(45, 48, 56, 0.95);
      color: #ffffff;
    }
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
    pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  }
`;

const MobileChipsScroller = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

/** 카테고리 칩과 좌측 플로팅 패널(ListPanel·DetailPanel) 사이 최소 간격 —
 *  화면이 좁아져 칩 목록이 왼쪽으로 자라날 때 이 간격 밑으로는 절대
 *  침범하지 않는다(대신 "···"로 더 일찍 접힌다). */
const CHIPS_PANELS_GAP = 16;

export default function MapPage() {
  const router = useRouter();
  const panelOpen = useMapStore((s) => s.panelOpen);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);

  const isDetailOpen = Boolean(detailId) || popularPanelOpen;

  // 카테고리 칩(MapChips)의 왼쪽 경계 —
  // 기본적으로 panelOpen이 true이므로, 초기값을 패널 우측 위치로 설정하여
  // 첫 렌더링 시 카테고리 칩셋이 패널 우측 제자리에 바로 위치하도록 한다 (우측 밀림 방지).
  // window.innerWidth로 분기하면 서버는 항상 else 분기(400px 패널)를 렌더하는데
  // 클라이언트 첫 렌더는 실제 뷰포트를 보고 분기해 1024~1440px 구간에서 SSR과
  // 값이 달라져 하이드레이션 불일치가 났었다 — 아래 useLayoutEffect가 마운트
  // 직후(페인트 전) 실제 패널 폭으로 다시 계산해 덮어쓰므로, 초기값은 서버·
  // 클라이언트가 항상 같은 값을 내도록 고정해도 된다.
  const defaultInitialChipsLeft = RAIL_INSET + RAIL_WIDTH + RAIL_INSET + 400 + CHIPS_PANELS_GAP;

  const floatingPanelsRef = useRef<HTMLDivElement>(null);
  const [chipsMinLeft, setChipsMinLeft] = useState<number>(defaultInitialChipsLeft);

  useLayoutEffect(() => {
    const panelsEl = floatingPanelsRef.current;
    if (!panelsEl || typeof ResizeObserver === 'undefined') return;

    const recalc = () => {
      // transform(x: -32)에 영향받지 않도록 getBoundingClientRect 대신
      // offsetLeft + offsetWidth를 사용하여 진입 애니메이션 중에도 칩이 우측으로 밀리지 않도록 완전 고정한다.
      const untransformedRight = panelsEl.offsetLeft + panelsEl.offsetWidth;
      const nextLeft =
        panelsEl.offsetWidth > 0
          ? Math.max(RAIL_INSET, untransformedRight + CHIPS_PANELS_GAP)
          : RAIL_INSET;
      setChipsMinLeft(nextLeft);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(panelsEl);
    window.addEventListener('resize', recalc);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [panelOpen]);

  // 지도 데이터(TourAPI 장소 + 온기 데이터) 패치 훅
  useMapData();

  const isRouteEntrance = useMapEntranceStore((s) => s.isRouteEntrance);
  const setRouteEntrance = useMapEntranceStore((s) => s.setRouteEntrance);

  // 한옥·오디 등 타 페이지에서 진입 시 1회 발동한 후,
  // 지도 내부 조작 시 재발동하지 않도록 연출 완료 후 false로 리셋
  useEffect(() => {
    if (isRouteEntrance) {
      const timer = setTimeout(() => {
        setRouteEntrance(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isRouteEntrance, setRouteEntrance]);

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
          $interactive={!isDetailOpen}
          style={{ left: chipsMinLeft }}
          initial={isRouteEntrance ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: isDetailOpen ? 0 : 1, y: isDetailOpen ? -6 : 0 }}
          transition={
            isRouteEntrance
              ? { ...CATEGORY_SPRING_TRANSITION, delay: CATEGORY_ENTER_DELAY_S }
              : { duration: 0 }
          }
        >
          {!panelOpen && (
            <FloatingHomeButton
              type="button"
              onClick={handleBack}
              aria-label="온마루 메인 홈으로 이동"
              title="온마루 메인 홈으로 이동"
            >
              <ChevronLeft size={16} strokeWidth={2} />
              <span>온마루 홈</span>
            </FloatingHomeButton>
          )}
          <CategoryChips align="start" />
        </MapChips>
        <WriteButton />

        {/* 온기 모드에서만: 히트맵 범례 · 화면 요약 · 기간 창 */}
        <WarmthLegend />
      </MapArea>

      {/* 2. 네이버 지도 스타일: 좌측 고정 세로 네비게이션 레일 (GNB) */}
      <MapNavRail />

      {/* 3. 지도 위에 떠 있는 좌측 리스트 + 우측 상세 플로팅 카드 —
          타 페이지에서 진입 시 좌에서 우로 슬라이드 인, 새로고침 시에는 정위치 고정 */}
      <FloatingPanelsContainer
        ref={floatingPanelsRef}
        initial={isRouteEntrance ? { opacity: 0, x: -32 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={
          isRouteEntrance
            ? { ...FLOATING_SPRING_TRANSITION, delay: FLOATING_ENTER_DELAY_S }
            : { duration: 0 }
        }
      >
        <ListPanel />
        <DetailPanel />
      </FloatingPanelsContainer>

      {/* 3. 모바일 상단 헤더: 가로 스크롤 카테고리 칩셋만 — 정보/온기 모드 전환은
          지도 위로 붕 뜨지 않도록 아래 BottomSheet(모달) 안, 목록 바로 위에
          그대로 유지한다. */}
      <MobileTopBar $hidden={isDetailOpen}>
        <MobileChipsScroller>
          <CategoryChips align="start" />
        </MobileChipsScroller>
      </MobileTopBar>

      {/* 4. 시네마틱 공간 오디오 투어 플로팅 컨트롤러 */}
      <CinematicTourFloatingBar />

      <BottomSheet />
    </Root>
  );
}

