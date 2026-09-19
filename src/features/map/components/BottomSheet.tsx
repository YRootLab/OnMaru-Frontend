'use client';

import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { surface } from '@/design-system/tokens';
import type { SheetSnap } from '@/features/map/types';
import ModeToggle from './ModeToggle';
import PlaceDetail from './PlaceDetail';
import PlaceList from './PlaceList';
import WarmthFeed from '@/private/core-ui/map-warmth/WarmthFeed';
import PopularPlacesPanel from '@/private/core-ui/map-warmth/PopularPlacesPanel';

const SNAPS: SheetSnap[] = ['peek', 'half', 'full'];

/** 하단 탭바(Header.tsx의 767px 이하 플로팅 캡슐)가 뷰포트 바닥에서 차지하는
 *  자리 — 58px 높이 + 최소 12px 여백(안전영역 고려). 시트는 이 뒤로 그대로
 *  이어져 들어가고(탭바가 z-index로 위에 얹혀 반투명 블러로 경계를 가려준다),
 *  peek(노치)에서는 이 자리보다 40px만 더 높여 손잡이만 탭바 위로 살짝
 *  드러나게 한다 — iOS/구글맵이 실제로 쓰는 방식. */
const TABBAR_TOP_OFFSET = 'calc(58px + max(12px, env(safe-area-inset-bottom)))';

/** 시트가 "보이는" 높이 — 3단(노치만/중간/풀). DateScrubber 등 외부
 *  컴포넌트가 시트 위로 얼마나 띄워야 하는지 계산할 때도 이 값을 그대로 쓴다.
 *  peek은 손잡이(노치)만 탭바 위로 겨우 드러날 만큼만 남기고, 정보/온기
 *  토글과 목록은 탭바 뒤로 접혀 들어간다. */
export const SNAP_CSS: Record<SheetSnap, string> = {
  peek: `calc(${TABBAR_TOP_OFFSET} + 40px)`,
  half: '46dvh',
  full: '86dvh',
};

const IDLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
/** 이 이상의 "높이 변화 속도"(px/s)로 손을 뗐다면, 놓은 위치와 무관하게
 *  그 방향의 끝(풀/노치)까지 튕겨 보낸다 — iOS 시트의 플링 제스처. */
const FLING_VELOCITY = 700;
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 };

// 탭바 자리(대략, 안전영역 제외) + 40px 리빌 — 드래그 물리 계산용 근사치.
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
  /* 하단 탭바(Header.tsx, z-index:100)보다 낮아야 시트가 그 뒤로 자연스럽게
     들어가고, 탭바의 반투명 블러가 경계를 가려준다. */
  z-index: 30;
  display: flex;
  flex-direction: column;
  height: ${({ $height }) => $height};
  /* 바닥은 탭바 뒤로 숨어 보이지 않으므로 위쪽만 둥글게 — 화면에 붙박인
     시트라는 인상을 준다. */
  border-radius: 24px 24px 0 0;
  background: #ffffff;
  box-shadow: 0 -4px 24px rgba(25, 31, 40, 0.14), 0 0 0 1px rgba(25, 31, 40, 0.04);

  transition: ${({ $dragging }) => ($dragging ? 'none' : `height 0.4s ${IDLE_EASE}`)};
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

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

/** 정보/온기 모드 전환은 지도 위로 붕 뜨지 않고, 그 모드가 지배하는 목록
 *  바로 위에서 시트(모달)에 속해 함께 움직인다 — 데스크톱 ListPanel의
 *  검색바+토글 헤더와 같은 구조. peek(노치)에서는 시트 높이가 이 영역보다
 *  작아 자연히 접혀 들어가 보이지 않는다. */
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

  const sheetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; active: boolean } | null>(null);
  const velocitySamples = useRef<{ t: number; y: number }[]>([]);
  const releaseAnim = useRef<ReturnType<typeof animate> | null>(null);
  const [dragH, setDragHState] = useState<number | null>(null);
  // 포인터 이벤트가 React 렌더 사이클보다 빠르게 연속 발생하면(특히 빠른
  // 플링), onPointerUp이 setDragH 이전 렌더의 오래된(stale) dragH를 그대로
  // 참조할 수 있다. 그 즉시성이 필요한 로직은 항상 이 ref에서 읽는다.
  const dragHRef = useRef<number | null>(null);
  const setDragH = (v: number | null) => {
    dragHRef.current = v;
    setDragHState(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const list = listRef.current;
    const fromList = !!list && list.contains(e.target as Node);
    // 리스트가 이미 스크롤돼 있으면 시트가 아니라 리스트를 움직이는 제스처다.
    if (fromList && list.scrollTop > 0) return;
    // 버튼(정보/온기 토글 등) 위에서 시작한 탭은 손끝이 살짝 흔들려도 시트
    // 드래그로 오인되지 않도록, 리스트와 동일하게 "약간 움직여야 활성화"로 다룬다.
    const onInteractive = Boolean((e.target as HTMLElement).closest('button, a, input'));
    releaseAnim.current?.stop();
    velocitySamples.current = [{ t: performance.now(), y: e.clientY }];
    drag.current = {
      startY: e.clientY,
      startH: sheetRef.current?.offsetHeight ?? snapPx(snap),
      active: !fromList && !onInteractive,
    };
    // 포인터 캡처가 없으면, 손가락이 빠르게 위로 움직여 시트(아직 리렌더 전이라
    // 작은 상태)의 경계를 벗어나는 순간 이후의 move/up이 지도 등 다른 요소로
    // 새 버려 제스처가 끊긴다 — 특히 빠른 플링에서 치명적이므로 반드시 잡아둔다.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 일부 환경에서 캡처가 불가할 수 있으나, 실패해도 기존 버블링 동작으로 폴백된다.
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    // 리스트/버튼 위에서 시작한 제스처는 일정 이상 움직여야 시트 드래그로 전환된다.
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
      // 이미 해제된 포인터 캡처는 무시
    }
    const active = drag.current?.active;
    drag.current = null;
    const liveH = dragHRef.current;
    if (!active || liveH === null) {
      setDragH(null);
      return;
    }

    // 최근 표본으로 "손가락이 움직인 속도"를 구하고, 시트 높이 기준으로 뒤집는다
    // (아래로 끌면 dy>0 → 높이 감소이므로, 높이 변화 속도는 부호가 반대다).
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
    // 놓는 순간의 속도를 그대로 물려받는 스프링으로 자연스럽게 안착시킨다 —
    // 세게 튕기면 빠르게, 살살 놓으면 느리게. 다 끝나면 dragH를 비워
    // SNAP_CSS의 dvh 값(리사이즈에도 안전한)으로 되돌아간다.
    releaseAnim.current = animate(liveH, snapPx(target), {
      ...SPRING,
      velocity: heightVelocity,
      onUpdate: (v) => setDragH(v),
      onComplete: () => setDragH(null),
    });
  };

  return (
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
              <ListArea ref={listRef}>
                {mode === 'warmth' ? <WarmthFeed /> : <PlaceList />}
              </ListArea>
            </MotionView>
          )}
        </AnimatePresence>
      </ContentContainer>
    </Sheet>
  );
}
