'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from '@emotion/styled';
import type { Item, PlaceCategory } from './types';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { transientProps } from '@/design-system/styled';
import { meok, surface , fontSize } from '@/design-system/tokens';
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
import WarmthLayer from '@/private/core-ui/map-warmth/WarmthLayer';
import WarmthNotesLayer from '@/private/core-ui/map-warmth/WarmthNotesLayer';
import WriteButton from '@/private/core-ui/map-warmth/WriteButton';
import WarmthLegend from '@/private/core-ui/map-warmth/WarmthLegend';
import MapNavRail, { RAIL_INSET, RAIL_WIDTH } from './components/MapNavRail';
import CinematicTourMapLayer from '@/features/cinematic-tour/components/CinematicTourMapLayer';
import CinematicTourFloatingBar from '@/features/cinematic-tour/components/CinematicTourFloatingBar';
import { StampSealAnimation, useStampStore } from '@/features/stamp';

const FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif";

const Root = styled.main`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: ${surface.light.card};
  font-family: ${FONT};

  [data-theme='dark'] & {
    background: ${surface.dark.app};
  }
`;


const MapArea = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;



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













const MapChips = styled(motion.div, transientProps)<{ $interactive: boolean }>`
  position: absolute;
  top: ${RAIL_INSET + 14}px;
  right: ${RAIL_INSET}px;
  left: ${RAIL_INSET}px;
  height: 54px;
  z-index: 30;
  display: flex;
  align-items: flex-start;
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
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.xs};
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


const WarmthControlsCluster = styled.div`
  position: absolute;
  right: 76px;
  bottom: 16px;
  z-index: 16;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  @media (max-width: 1023px) {
    right: 16px;
    bottom: 140px;
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




const CHIPS_PANELS_GAP = 16;

export default function MapPage() {
  const router = useRouter();
  const mode = useMapStore((s) => s.mode);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);

  const isDetailOpen = Boolean(detailId) || popularPanelOpen;









  const defaultInitialChipsLeft = RAIL_INSET + RAIL_WIDTH + RAIL_INSET + 400 + CHIPS_PANELS_GAP;

  const floatingPanelsRef = useRef<HTMLDivElement>(null);
  const [chipsMinLeft, setChipsMinLeft] = useState<number>(defaultInitialChipsLeft);

  useLayoutEffect(() => {
    const panelsEl = floatingPanelsRef.current;
    if (!panelsEl || typeof ResizeObserver === 'undefined') return;

    const recalc = () => {


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


  const searchParams = useSearchParams();
  const queryLat = searchParams?.get('lat') || null;
  const queryLng = searchParams?.get('lng') || null;
  const queryId = searchParams?.get('id') || null;
  const queryTitle = searchParams?.get('title') || null;
  const queryAddr = searchParams?.get('addr') || null;
  const queryImage = searchParams?.get('image') || null;
  const queryCategory = searchParams?.get('category') || null;

  const parsedLat = parseFloat(queryLat || '');
  const parsedLng = parseFloat(queryLng || '');
  const hasTargetLocation =
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    parsedLat >= 33 &&
    parsedLat <= 39 &&
    parsedLng >= 124 &&
    parsedLng <= 132;

  useEffect(() => {
    if (!hasTargetLocation) return;

    const targetId = queryId || `target_${parsedLat}_${parsedLng}`;
    const targetItem: Item = {
      id: targetId,
      name: queryTitle || '한옥 장소',
      category: (queryCategory as PlaceCategory) || 'stay',
      lat: parsedLat,
      lng: parsedLng,
      addr: queryAddr || '',
      image: queryImage || null,
      tel: null,
      dist: 0,
      isTraditional: true,
    };

    const targetCoord = { lat: parsedLat, lng: parsedLng };


    const currentMap = useMapStore.getState().map;
    if (currentMap && window.kakao?.maps) {
      currentMap.setLevel(4, { animate: false });
      currentMap.setCenter(new window.kakao.maps.LatLng(parsedLat, parsedLng));
    }


    useMapStore.setState((state) => {
      const existingIdx = state.items.findIndex((it) => it.id === targetId);
      let nextItems = state.items;
      if (existingIdx === -1) {
        nextItems = [targetItem, ...state.items];
      } else {
        nextItems = [...state.items];
        nextItems[existingIdx] = { ...nextItems[existingIdx], ...targetItem };
      }

      return {
        center: targetCoord,
        searchCenter: targetCoord,
        level: 4,
        selectedId: targetId,
        detailId: targetId,
        panelOpen: true,
        sheetSnap: 'full',
        isSearchDirty: false,
        items: nextItems,
        category: queryCategory || state.category,
      };
    });
  }, [
    hasTargetLocation,
    parsedLat,
    parsedLng,
    queryId,
    queryTitle,
    queryAddr,
    queryImage,
    queryCategory,
  ]);


  useMapData();

  const isRouteEntrance = useMapEntranceStore((s) => s.isRouteEntrance);
  const setRouteEntrance = useMapEntranceStore((s) => s.setRouteEntrance);

  const activeStampModal = useStampStore((s) => s.activeStampModal);
  const closeStampModal = useStampStore((s) => s.closeStampModal);



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
      {}
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

        {}
        {mode === 'warmth' && (
          <WarmthControlsCluster>
            <WriteButton />
            <WarmthLegend />
          </WarmthControlsCluster>
        )}
      </MapArea>

      {}
      <MapNavRail />

      {
}
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

      {

}
      <MobileTopBar $hidden={isDetailOpen}>
        <MobileChipsScroller>
          <CategoryChips align="start" />
        </MobileChipsScroller>
      </MobileTopBar>

      {}
      <CinematicTourFloatingBar />

      <BottomSheet />

      {}
      <StampSealAnimation
        stamp={activeStampModal}
        onClose={closeStampModal}
      />
    </Root>
  );
}
