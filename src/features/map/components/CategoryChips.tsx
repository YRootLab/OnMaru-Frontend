'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Coffee,
  Flame,
  Heart,
  Home,
  Landmark,
  Leaf,
  ShoppingBag,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { meok , fontSize } from '@/design-system/tokens';

import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { MapMode } from '@/features/map/types';

interface CategoryItem {
  id: string;
  label: string;
  keyword: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean; strokeWidth?: number }>;
}

const CATEGORIES: Record<MapMode, CategoryItem[]> = {
  info: [
    { id: 'spot', label: '고택', keyword: '고택', icon: Landmark },
    { id: 'experience', label: '전통 체험', keyword: '체험', icon: Sparkles },
    { id: 'culture', label: '문화유산', keyword: '서원', icon: BookOpen },
    { id: 'festival', label: '축제', keyword: '축제', icon: Calendar },
    { id: 'stay', label: '한옥 숙소', keyword: '한옥스테이', icon: Home },
    { id: 'food', label: '전통 맛집', keyword: '향토음식', icon: Utensils },
    { id: 'cafe', label: '한옥 카페', keyword: '한옥카페', icon: Coffee },
    { id: 'market', label: '전통 시장', keyword: '전통시장', icon: ShoppingBag },
  ],
  warmth: [
    { id: 'all', label: '전체 온기', keyword: '', icon: Flame },
    { id: 'busy', label: '북적이는 곳', keyword: '북적', icon: Users },
    { id: 'quiet', label: '한적한 곳', keyword: '한적', icon: Leaf },
    { id: 'today', label: '오늘 이야기', keyword: '오늘', icon: Calendar },
    { id: 'mine', label: '내가 쓴 글', keyword: '내온기', icon: Heart },
  ],
};

const GAP = 6;

const chipPopIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

/** 카테고리 칩이 가용 폭보다 많아지면 "···"로 접는 대신, 가로로 자연스럽게
 *  스크롤되도록 한다 — 네이버맵/카카오맵의 카테고리 필터 행과 같은 익숙한
 *  패턴. 터치는 브라우저 네이티브 스크롤에 맡기고, 마우스 사용자를 위해
 *  누르고 끄는(press-drag) 스크롤과 휠→가로 스크롤 변환을 함께 지원한다.
 *  PR #66의 가로 스크롤 수축 동작은 유지하되, mask-image는 쓰지 않는다.
 *  mask가 칩의 box-shadow까지 같이 잘라서 지도 위에서 그림자가 끊겨 보였기 때문이다. */
const Scroller = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  user-select: none;
  padding: 2px 4px 12px;

  &::-webkit-scrollbar {
    display: none;
  }

  &:active {
    cursor: grabbing;
  }
`;

/** 정보⇄온기 모드가 바뀔 때 그룹 전체를 짧게 페이드한다.
 *  absolute 겹침을 쓰면 스크롤러의 실제 폭/높이 계산이 흐려져 칩이 눌려
 *  보일 수 있으므로, 실제 콘텐츠 크기를 가진 flex row로 둔다. */
const ModeGroup = styled(motion.div, transientProps)<{ $align: 'start' | 'end' }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
  gap: ${GAP}px;
  width: max-content;
  min-width: 100%;
`;

const Chip = styled.button<{ $active: boolean; $index: number }>`
  display: flex;
  flex: none;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;

  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.94)')};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none;

  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  opacity: 0;
  animation: ${chipPopIn} 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${({ $index }) => $index * 40}ms;

  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
    background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }

  @media (max-width: 1023px) {
    height: 32px;
    padding: 0 11px;
    font-size: ${fontSize.xs};
    gap: 4px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(30, 32, 38, 0.92)')};
    border: none;
    color: ${({ $active }) => ($active ? meok[900] : meok[200])};
    box-shadow: none;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(30, 32, 38, 0.92)')};
      border: none;
      color: ${({ $active }) => ($active ? meok[900] : meok[200])};
      box-shadow: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
    transition: none;
  }
`;

const ChipWrap = styled.div`
  flex: none;
`;

interface CategoryChipsProps {
  /** 좁은 폭에서 칩이 어느 쪽 끝에서부터 자라나야 하는지. 패널/검색바 바로
   *  옆에서 시작해 오른쪽(지도 쪽)으로 흘러야 화면이 넓어져도 패널과의
   *  간격이 벌어지지 않으므로 기본값은 'start'. */
  align?: 'start' | 'end';
}

/** 지도 위 카테고리 필터 칩 목록.
 *  칩 개수가 가용 폭을 넘으면 숨기는 대신 가로 스크롤로 접근한다 —
 *  터치는 네이티브 스크롤, 마우스는 press-drag와 휠을 지원한다. */
export default function CategoryChips({ align = 'start' }: CategoryChipsProps) {
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const triggerSearch = useMapStore((s) => s.triggerSearch);

  const items = CATEGORIES[mode];
  const containerRef = useRef<HTMLDivElement>(null);

  const isItemActive = useCallback(
    (item: CategoryItem) =>
      mode === 'warmth'
        ? (item.id === 'all' && (!category || category === 'all')) || category === item.id
        : category === item.id,
    [mode, category]
  );

  const handleChipClick = (item: CategoryItem) => {
    // 1. 온기 모드에서는 카테고리 필터 변경 (이미 선택된 것을 다시 누르면 'all'로 초기화)
    if (mode === 'warmth') {
      if (item.id === 'all' || category === item.id) {
        setCategory(null);
      } else {
        setCategory(item.id);
      }
      return;
    }

    // 2. 정보 모드에서는 카테고리 필터 토글 & 패널 열기
    if (category === item.id) {
      setCategory(null);
    } else {
      setCategory(item.id);
      if (!useMapStore.getState().panelOpen) {
        useMapStore.getState().setPanelOpen(true);
      }
    }
  };

  // 스크롤 위치가 바뀔 때 레이아웃을 재측정해 브라우저의 네이티브 가로
  // 스크롤 수축 상태를 안정화한다. 시각적 fade mask는 그림자를 자르므로 제거했다.
  const updateEdgeFade = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--scroll-left', `${el.scrollLeft}px`);
  }, []);

  // 마우스로 누른 채 좌우로 끌면 스크롤되는 press-drag. 터치는 브라우저
  // 네이티브 스크롤에 맡기므로 pointerType이 'mouse'일 때만 개입한다.
  const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const container = containerRef.current;
    if (!container) return;
    dragRef.current = { startX: e.clientX, startScrollLeft: container.scrollLeft, moved: false };
    // pointerdown 시점에 즉시 setPointerCapture를 호출하면 자식 버튼의 click 이벤트가 막히므로
    // 실제 드래그 이동이 발생했을 때만 캡처를 활성화한다.
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // 무시
      }
    }
    if (drag.moved) {
      container.scrollLeft = drag.startScrollLeft - dx;
      updateEdgeFade();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container && dragRef.current?.moved) {
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // 이미 해제된 포인터 캡처는 무시
      }
    }
    // 드래그로 스크롤한 직후의 클릭이 칩 선택으로 이어지지 않도록, 다음
    // click 이벤트 1회만 캡처 단계에서 막는다.
    suppressClickRef.current = Boolean(dragRef.current?.moved);
    dragRef.current = null;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      container.scrollLeft += e.deltaY;
    }
  };

  useLayoutEffect(() => {
    updateEdgeFade();
  }, [updateEdgeFade, mode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdgeFade, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdgeFade) : null;
    observer?.observe(el);
    // 모드 전환 크로스페이드(180ms)가 끝나고 옛 칩 세트가 실제로 걷힌
    // 뒤의 최종 scrollWidth도 한 번 더 반영한다.
    const settleTimer = window.setTimeout(updateEdgeFade, 220);
    return () => {
      el.removeEventListener('scroll', updateEdgeFade);
      observer?.disconnect();
      window.clearTimeout(settleTimer);
    };
  }, [updateEdgeFade, mode]);

  return (
    <Scroller
      ref={containerRef}
      role="group"
      aria-label="카테고리 필터"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
      onWheel={handleWheel}
    >
      <AnimatePresence initial={false} mode="wait">
        <ModeGroup
          key={mode}
          $align={align}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <ChipWrap key={item.id}>
                <Chip
                  type="button"
                  $active={isActive}
                  $index={index}
                  aria-pressed={isActive}
                  onClick={() => handleChipClick(item)}
                >
                  <Icon size={16} aria-hidden />
                  <span>{item.label}</span>
                </Chip>
              </ChipWrap>
            );
          })}
        </ModeGroup>
      </AnimatePresence>
    </Scroller>
  );
}
