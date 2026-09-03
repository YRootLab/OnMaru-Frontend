'use client';

import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { SheetSnap } from '@/map/types';
import CategoryChips from './CategoryChips';
import PlaceDetail from './PlaceDetail';
import PlaceList from './PlaceList';
import WarmthFeed from './warmth/WarmthFeed';

const SNAPS: SheetSnap[] = ['peek', 'half', 'full'];
const SNAP_CSS: Record<SheetSnap, string> = { peek: '96px', half: '56dvh', full: '90dvh' };
const SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)';

const snapPx = (snap: SheetSnap) => {
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  return snap === 'peek' ? 96 : vh * (snap === 'half' ? 0.56 : 0.9);
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
  border-radius: 28px 28px 0 0;
  background: #ffffff;
  box-shadow: 0 -4px 24px rgba(25, 31, 40, 0.12);

  transition: ${({ $dragging }) => ($dragging ? 'none' : `height 0.4s ${SPRING}`)};
  overflow: hidden;

  @media (min-width: 1024px) {
    display: none;
  }
`;

/** 드래그 영역은 상단 40px 전체. */
const Grab = styled.div`
  flex: none;
  height: 38px;
  touch-action: none;
  cursor: grab;
`;

const Handle = styled.div`
  width: 44px;
  height: 5px;
  margin: 10px auto;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.28);
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

const TopSection = styled.div`
  flex: none;
`;

const Chips = styled.div`
  flex: none;
  padding: 0 16px 10px;
`;

const ListArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding-bottom: 84px;
`;

const OpenList = styled.button`
  position: fixed;
  bottom: 84px;
  left: 50%;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  transform: translateX(-50%);

  border-radius: 9999px;
  background: #191F28;
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(25, 31, 40, 0.25);
  cursor: pointer;
  animation: om-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;

  @keyframes om-pop {
    from { transform: translate(-50%, 10px) scale(0.9); opacity: 0; }
    to { transform: translate(-50%, 0) scale(1); opacity: 1; }
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

export default function BottomSheet() {
  const snap = useMapStore((s) => s.sheetSnap);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const mode = useMapStore((s) => s.mode);
  const detailId = useMapStore((s) => s.detailId);

  const sheetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; active: boolean } | null>(null);
  const [dragH, setDragH] = useState<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const list = listRef.current;
    const fromList = !!list && list.contains(e.target as Node);
    // 리스트가 이미 스크롤돼 있으면 시트가 아니라 리스트를 움직이는 제스처다.
    if (fromList && list.scrollTop > 0) return;
    drag.current = {
      startY: e.clientY,
      startH: sheetRef.current?.offsetHeight ?? snapPx(snap),
      active: !fromList,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    // 리스트 최상단에서 시작한 제스처는 아래로 당길 때만 시트를 줄인다.
    if (!d.active) {
      if (dy <= 4) return;
      d.active = true;
    }
    setDragH(Math.min(snapPx('full'), Math.max(snapPx('peek'), d.startH - dy)));
  };

  const onPointerUp = () => {
    const active = drag.current?.active;
    drag.current = null;
    if (active && dragH !== null) {
      const nearest = SNAPS.reduce((best, s) =>
        Math.abs(snapPx(s) - dragH) < Math.abs(snapPx(best) - dragH) ? s : best,
      );
      setSheetSnap(nearest);
    }
    setDragH(null);
  };

  return (
    <>
      {snap === 'peek' && (
        <OpenList type="button" onClick={() => setSheetSnap('half')}>
          목록보기
        </OpenList>
      )}

      <Sheet
        ref={sheetRef}
        role="dialog"
        aria-label="장소 목록"
        $height={dragH !== null ? `${dragH}px` : SNAP_CSS[snap]}
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
            {detailId ? (
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
                <TopSection>
                  <Chips>
                    <CategoryChips />
                  </Chips>
                </TopSection>

                <ListArea ref={listRef}>
                  {mode === 'warmth' ? <WarmthFeed /> : <PlaceList />}
                </ListArea>
              </MotionView>
            )}
          </AnimatePresence>
        </ContentContainer>
      </Sheet>
    </>
  );
}
