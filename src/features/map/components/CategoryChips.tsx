'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  Sparkles,
  BookOpen,
  Calendar,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
  Flame,
  Users,
  Leaf,
  Heart,
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
    { id: 'spot', label: '고택·명소', keyword: '고택', icon: Landmark },
    { id: 'experience', label: '한복·전통체험', keyword: '체험', icon: Sparkles },
    { id: 'culture', label: '문화재·서원', keyword: '서원', icon: BookOpen },
    { id: 'festival', label: '야행·축제', keyword: '축제', icon: Calendar },
    { id: 'stay', label: '한옥숙소', keyword: '한옥스테이', icon: Home },
    { id: 'food', label: '향토음식', keyword: '향토음식', icon: Utensils },
    { id: 'cafe', label: '한옥카페·디저트', keyword: '한옥카페', icon: Coffee },
    { id: 'market', label: '전통시장', keyword: '전통시장', icon: ShoppingBag },
  ],
  warmth: [
    { id: 'all', label: '모든 온기', keyword: '', icon: Flame },
    { id: 'busy', label: '북적이는 곳', keyword: '북적', icon: Users },
    { id: 'quiet', label: '한적한 곳', keyword: '한적', icon: Leaf },
    { id: 'today', label: '오늘의 온기', keyword: '오늘', icon: Calendar },
    { id: 'mine', label: '내 온기', keyword: '내온기', icon: Heart },
  ],
};

const GAP = 6;

/** 스크롤 가능한 방향의 가장자리를 부드럽게 지워, "여기서 잘렸다"가 아니라
 *  "옆으로 더 있다"는 걸 알려주는 페이드 폭. 지도 위에 뜨는 배경이 지도
 *  이미지라 색이 일정하지 않으므로, 불투명 그라디언트 오버레이 대신
 *  mask-image로 칩 자체를 옅게 만든다 — 뒤에 뭐가 있든 자연스럽게 비친다. */
const EDGE_FADE_WIDTH = 28;

/** 카테고리 칩이 가용 폭보다 많아지면 "···"로 접는 대신, 가로로 자연스럽게
 *  스크롤되도록 한다 — 네이버맵/카카오맵의 카테고리 필터 행과 같은 익숙한
 *  패턴. 터치는 브라우저 네이티브 스크롤에 맡기고, 마우스 사용자를 위해
 *  누르고 끄는(press-drag) 스크롤과 휠→가로 스크롤 변환을 함께 지원한다.
 *  스크롤할 더 있는 쪽 가장자리는 --fade-start/--fade-end로 폭을 조절해
 *  옅게 사라지고, 끝까지 스크롤하면 그 쪽은 다시 또렷해진다. */
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
  /* ModeGroup은 위치 이동 없이 opacity만 크로스페이드된다 — 칩 box-shadow가
     잘리지 않을 정도의 여백만 있으면 된다. */
  padding: 10px 4px 16px;

  --fade-start: 0px;
  --fade-end: 0px;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--fade-start),
    black calc(100% - var(--fade-end)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--fade-start),
    black calc(100% - var(--fade-end)),
    transparent 100%
  );

  &::-webkit-scrollbar {
    display: none;
  }

  &:active {
    cursor: grabbing;
  }
`;

/** 정보⇄온기 모드가 바뀔 때 이 그룹 전체가 조용히 opacity로만 교체된다 —
 *  위아래 이동(translateY)이나 스프링 바운스 없이 짧은 easeOut 크로스페이드만
 *  써서 산만하지 않게 차분한 전환을 준다. 나가는 그룹과 들어오는 그룹이 겹치는
 *  동안(순차 대기 없이) 같은 자리를 차지해야 크로스페이드처럼 보이므로
 *  absolute로 겹쳐 쌓는다. */
const ModeGroup = styled(motion.div, transientProps)<{ $align: 'start' | 'end' }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
  gap: ${GAP}px;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: flex;
  flex: none;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 11px;

  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.94)')};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${({ $active }) => ($active ? meok[900] : 'rgba(25, 31, 40, 0.08)')};

  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active
      ? '0 4px 12px rgba(25, 31, 40, 0.2)'
      : '0 2px 6px rgba(0, 0, 0, 0.05)'};

  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
    background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    transform: translateY(-1px);
    box-shadow: ${({ $active }) =>
      $active
        ? '0 6px 16px rgba(25, 31, 40, 0.22)'
        : '0 4px 12px rgba(0, 0, 0, 0.08)'};
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
    border-color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)')};
    color: ${({ $active }) => ($active ? meok[900] : meok[200])};
    box-shadow: ${({ $active }) =>
      $active
        ? '0 4px 12px rgba(255, 255, 255, 0.2)'
        : '0 2px 6px rgba(0, 0, 0, 0.4)'};
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(30, 32, 38, 0.92)')};
      border-color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)')};
      color: ${({ $active }) => ($active ? meok[900] : meok[200])};
      box-shadow: ${({ $active }) =>
        $active
          ? '0 4px 12px rgba(255, 255, 255, 0.2)'
          : '0 2px 6px rgba(0, 0, 0, 0.4)'};
    }
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
      if (item.id === 'all') {
        setCategory(null);
      } else if (category === item.id) {
        setCategory(null);
      } else {
        setCategory(item.id);
      }
      return;
    }

    // 2. 정보 모드에서는 카테고리 필터 설정과 함께 검색 실행
    if (category === item.id) {
      setCategory(null);
      triggerSearch('');
    } else {
      setCategory(item.id);
      triggerSearch(item.keyword || item.label);
    }
  };

  // 스크롤 위치에 따라 좌/우 가장자리 페이드 폭을 갱신 — 더 스크롤할 수
  // 있는 쪽만 옅어지고, 끝에 닿으면 그 쪽은 다시 또렷해진다.
  const updateEdgeFade = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const canScrollLeft = el.scrollLeft > 1;
    const canScrollRight = el.scrollLeft < maxScrollLeft - 1;
    el.style.setProperty('--fade-start', canScrollLeft ? `${EDGE_FADE_WIDTH}px` : '0px');
    el.style.setProperty('--fade-end', canScrollRight ? `${EDGE_FADE_WIDTH}px` : '0px');
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
    container.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    container.scrollLeft = drag.startScrollLeft - dx;
    updateEdgeFade();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
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
      <AnimatePresence initial={false}>
        <ModeGroup
          key={mode}
          $align={align}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <ChipWrap key={item.id}>
                <Chip
                  type="button"
                  $active={isActive}
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
