'use client';

import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { surface, palette } from '@/design-system/tokens';
import type { SheetSnap } from '@/features/map/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { LocateFixedIcon } from '@hugeicons/core-free-icons';
import ModeToggle from './ModeToggle';
import PlaceDetail from './PlaceDetail';
import InfoPlaceList from './InfoPlaceList';
import WarmthFeed from '@/private/core-ui/map-warmth/WarmthFeed';
import PopularPlacesPanel from '@/private/core-ui/map-warmth/PopularPlacesPanel';
import { useInfoListScrollRestoration } from '@/features/map/presentation/useInfoListScrollRestoration';

const SNAPS: SheetSnap[] = ['peek', 'half', 'full'];






const TABBAR_TOP_OFFSET = 'calc(58px + max(12px, env(safe-area-inset-bottom)))';





export const SNAP_CSS: Record<SheetSnap, string> = {
  peek: `calc(${TABBAR_TOP_OFFSET} + 40px)`,
  half: '46dvh',
  full: '86dvh',
};

const IDLE_EASE = 'cubic-bezier(0.19, 1.15, 0.22, 1)';


const FLING_VELOCITY = 700;
const SPRING = { type: 'spring' as const, stiffness: 340, damping: 25, mass: 0.88 };


const PEEK_PX_APPROX = 58 + 12 + 40;

const snapPx = (snap: SheetSnap) => {
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  if (snap === 'peek') return PEEK_PX_APPROX;
  return vh * (snap === 'half' ? 0.46 : 0.86);
};

const Sheet = styled.div<{ $height: string; $dragging: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;


  z-index: 30;
  display: flex;
  flex-direction: column;
  height: ${({ $height }) => $height};


  border-radius: 24px 24px 0 0;
  background: #ffffff;
  box-shadow: 0 -4px 24px rgba(25, 31, 40, 0.14), 0 0 0 1px rgba(25, 31, 40, 0.04);

  transition: ${({ $dragging }) => ($dragging ? 'none' : `height 0.4s ${IDLE_EASE}`)};
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 -1px 2px rgba(255, 255, 255, 0.04);
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

const FloatingMyLocationButton = styled.button<{
  $bottom: string;
  $dragging: boolean;
  $hidden: boolean;
  $locating: boolean;
}>`
  position: fixed;
  right: 16px;
  bottom: ${({ $bottom }) => `calc(${$bottom} + 12px)`};
  z-index: 35;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(25, 31, 40, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${palette.cheongrok[600]};
  transition: ${({ $dragging }) =>
    $dragging
      ? 'opacity 0.2s ease, transform 0.15s ease'
      : `bottom 0.4s ${IDLE_EASE}, opacity 0.2s ease, transform 0.15s ease`};
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};

  & svg {
    ${({ $locating }) => ($locating ? 'animation: om-spin 1s linear infinite;' : '')}
  }

  @keyframes om-spin {
    to {
      transform: rotate(360deg);
    }
  }

  &:hover {
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  }

  &:active {
    transform: scale(0.92);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: 1024px) {
    display: none;
  }

  [data-theme='dark'] & {
    background: rgba(30, 32, 38, 0.92);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    color: ${palette.cheongrok[400]};

    &:hover {
      background: rgba(36, 40, 48, 0.96);
    }
  }
`;

const Grab = styled.div`
  flex: none;
  height: 38px;
  touch-action: none;
  cursor: grab;
`;

const Handle = styled.div`
  width: 38px;
  height: 5px;
  margin: 10px auto;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.28);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.24);
  }
`;

const ContentContainer = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
`;

const MotionView = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;





const ModeToggleHeader = styled.div`
  flex: none;
  padding: 4px 16px 12px;
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding-bottom: 84px;
`;

export default function BottomSheet() {
  const snap = useMapStore((s) => s.sheetSnap);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const mode = useMapStore((s) => s.mode);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);
  const isLocating = useMapStore((s) => s.isLocating);
  const requestMyLocation = useMapStore((s) => s.requestMyLocation);

  const sheetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { onScroll: onInfoListScroll } = useInfoListScrollRestoration('mobile', listRef);
  const drag = useRef<{ startY: number; startH: number; active: boolean } | null>(null);
  const velocitySamples = useRef<{ t: number; y: number }[]>([]);
  const releaseAnim = useRef<ReturnType<typeof animate> | null>(null);
  const [dragH, setDragHState] = useState<number | null>(null);

  const dragHRef = useRef<number | null>(null);
  const setDragH = (v: number | null) => {
    dragHRef.current = v;
    setDragHState(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const list = listRef.current;
    const fromList = !!list && list.contains(e.target as Node);

    if (fromList && list.scrollTop > 0) return;

    const onInteractive = Boolean((e.target as HTMLElement).closest('button, a, input'));
    releaseAnim.current?.stop();
    velocitySamples.current = [{ t: performance.now(), y: e.clientY }];
    drag.current = {
      startY: e.clientY,
      startH: sheetRef.current?.offsetHeight ?? snapPx(snap),
      active: !fromList && !onInteractive,
    };

    // 버튼/링크는 capture하지 않아야 click이 정상 발동됨
    if (!onInteractive) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {

      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      if (Math.abs(dy) <= 4) return;
      d.active = true;
    }
    const nextH = Math.min(snapPx('full'), Math.max(snapPx('peek'), d.startH - dy));
    setDragH(nextH);

    const samples = velocitySamples.current;
    samples.push({ t: performance.now(), y: e.clientY });
    if (samples.length > 5) samples.shift();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {

    }
    const active = drag.current?.active;
    drag.current = null;
    const liveH = dragHRef.current;
    if (!active || liveH === null) {
      setDragH(null);
      return;
    }

    const samples = velocitySamples.current;
    let heightVelocity = 0;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) heightVelocity = -((last.y - first.y) / dt) * 1000;
    }
    velocitySamples.current = [];

    let target: SheetSnap;
    if (heightVelocity > FLING_VELOCITY) {
      target = 'full';
    } else if (heightVelocity < -FLING_VELOCITY) {
      target = 'peek';
    } else {
      target = SNAPS.reduce((best, s) =>
        Math.abs(snapPx(s) - liveH) < Math.abs(snapPx(best) - liveH) ? s : best,
      );
    }

    setSheetSnap(target);

    releaseAnim.current = animate(liveH, snapPx(target), {
      ...SPRING,
      velocity: heightVelocity,
      onUpdate: (v) => setDragH(v),
      onComplete: () => setDragH(null),
    });
  };

  const isDraggingNearFull =
    dragH !== null && typeof window !== 'undefined' && dragH > window.innerHeight * 0.72;
  const isLocationBtnHidden = mode === 'warmth' || snap === 'full' || isDraggingNearFull;
  const currentHeight = dragH !== null ? `${dragH}px` : SNAP_CSS[snap];

  return (
    <>
      <FloatingMyLocationButton
        type="button"
        aria-label="내 위치로 이동"
        title="내 위치로 이동"
        $bottom={currentHeight}
        $dragging={dragH !== null}
        $hidden={isLocationBtnHidden}
        $locating={isLocating}
        onClick={() => {
          requestMyLocation();
          if (snap === 'full') setSheetSnap('half');
        }}
      >
        <HugeiconsIcon icon={LocateFixedIcon} size={22} strokeWidth={1.8} />
      </FloatingMyLocationButton>

      <Sheet
        ref={sheetRef}
        role="dialog"
        aria-label="장소 목록"
        $height={currentHeight}
        $dragging={dragH !== null}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Grab role="separator" aria-label="시트 높이 조절 핸들">
          <Handle />
        </Grab>

        <ContentContainer>
          <AnimatePresence initial={false} mode="wait">
            {popularPanelOpen ? (
              <MotionView
                key="popular"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PopularPlacesPanel />
              </MotionView>
            ) : detailId ? (
              <MotionView
                key="detail"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PlaceDetail />
              </MotionView>
            ) : (
              <MotionView
                key="list"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <ModeToggleHeader>
                  <ModeToggle compact fullWidth />
                </ModeToggleHeader>
                <ListArea ref={listRef} onScroll={onInfoListScroll}>
                  {mode === 'warmth' ? <WarmthFeed /> : <InfoPlaceList />}
                </ListArea>
              </MotionView>
            )}
          </AnimatePresence>
        </ContentContainer>
      </Sheet>
    </>
  );
}
