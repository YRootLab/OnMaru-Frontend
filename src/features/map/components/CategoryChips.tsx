'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar01Icon, Coffee01Icon, FlameIcon, GridViewIcon, HeartIcon, LandmarkIcon, Leaf01Icon, Moon01Icon, ShoppingBag01Icon, SparklesIcon, UsersIcon, UtensilsIcon } from '@hugeicons/core-free-icons'
import { transientProps } from '@/design-system/styled';
import { meok, palette, fontFamily, fontSize, ringShadow } from '@/design-system/tokens';

import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { MapInfoCategory, MapMode } from '@/features/map/types';
import { HanokIcon } from './HanokIcon';

interface CategoryItem {
  id: string;
  label: string;
  keyword: string;
  icon: IconSvgElement;
  isEmphasis?: boolean;
}

const CATEGORIES: Record<MapMode, CategoryItem[]> = {
  info: [
    // [한옥 강조 칩] 도현체 + juhong[700] 배경 + 흰 글자 (정보 모드 전용)
    { id: 'hanok', label: '한옥', keyword: '한옥', icon: LandmarkIcon, isEmphasis: true },
    { id: 'spot', label: '고택', keyword: '고택', icon: LandmarkIcon },
    { id: 'experience', label: '전통 체험', keyword: '체험', icon: SparklesIcon },
    { id: 'culture', label: '문화유산', keyword: '서원', icon: LandmarkIcon },
    { id: 'festival', label: '축제', keyword: '축제', icon: Calendar01Icon },
    { id: 'stay', label: '숙소', keyword: '한옥스테이', icon: Moon01Icon },
    { id: 'food', label: '전통 맛집', keyword: '향토음식', icon: UtensilsIcon },
    { id: 'cafe', label: '한옥 카페', keyword: '한옥카페', icon: Coffee01Icon },
    { id: 'market', label: '전통 시장', keyword: '전통시장', icon: ShoppingBag01Icon },
    { id: 'all', label: '전체', keyword: '', icon: GridViewIcon },
  ],
  warmth: [
    { id: 'all', label: '전체 온기', keyword: '', icon: FlameIcon },
    { id: 'busy', label: '북적이는 곳', keyword: '북적', icon: UsersIcon },
    { id: 'quiet', label: '한적한 곳', keyword: '한적', icon: Leaf01Icon },
    { id: 'today', label: '오늘 이야기', keyword: '오늘', icon: Calendar01Icon },
    { id: 'mine', label: '내가 쓴 글', keyword: '내온기', icon: HeartIcon },
  ],
};

function getCategoryActiveColor(categoryId: string): string {
  switch (categoryId) {
    case 'hanok':
      return palette.juhong[500];
    case 'stay':
      return palette.jangmi[600];
    case 'food':
      return palette.cheongrok[700];
    case 'cafe':
      return palette.cheongrok[600];
    case 'market':
      return palette.cheongrok[800];
    case 'spot':
      return palette.kobalt[600];
    case 'culture':
      return palette.kobalt[700];
    case 'experience':
      return palette.jaha[500];
    case 'festival':
      return palette.jaha[600];
    default:
      return meok[900];
  }
}

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

const ModeGroup = styled(motion.div, transientProps)<{ $align: 'start' | 'end' }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
  gap: ${GAP}px;
  width: max-content;
  min-width: 100%;
`;

const Chip = styled.button<{
  $active: boolean;
  $index: number;
  $isEmphasis?: boolean;
  $categoryColor?: string;
}>`
  display: flex;
  flex: none;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;

  border-radius: 9999px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  white-space: nowrap;
  cursor: pointer;
  opacity: 0;
  animation: ${chipPopIn} 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${({ $index }) => $index * 40}ms;

  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    font-weight 0.18s ease;

  /* 폰트: 전체 카테고리 칩 통일 */
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  font-size: ${fontSize.xs};
  letter-spacing: -0.02em;

  /* 배경색은 변경 없이 유지, 활성화(active) 시 아이콘 및 폰트 색상만 변경 */
  background: rgba(255, 255, 255, 0.94);
  border-color: ${({ $active, $categoryColor }) =>
    $active ? ($categoryColor || meok[900]) : 'rgba(0, 0, 0, 0.08)'};
  color: ${({ $active, $categoryColor }) =>
    $active ? ($categoryColor || meok[900]) : meok[700]};
  box-shadow: ${({ $active, $categoryColor }) =>
    $active
      ? `0 0 0 1px ${$categoryColor || meok[900]}, 0 2px 8px rgba(0, 0, 0, 0.08)`
      : '0 1px 3px rgba(0, 0, 0, 0.06)'};

  svg {
    flex-shrink: 0;
  }

  &:hover {
    /* 호버 시 배경색 변경 없이 폰트 굵게 */
    font-weight: 700;
    color: ${({ $active, $categoryColor }) =>
      $active ? ($categoryColor || meok[900]) : meok[900]};
    border-color: ${({ $active, $categoryColor }) =>
      $active ? ($categoryColor || meok[900]) : meok[400]};
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.09);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${({ $categoryColor }) => $categoryColor || meok[900]};
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
    background: rgba(23, 30, 43, 0.92);
    border-color: ${({ $active, $categoryColor }) =>
      $active ? ($categoryColor || '#5EA4FF') : 'rgba(255, 255, 255, 0.12)'};
    color: ${({ $active, $categoryColor }) =>
      $active ? ($categoryColor || '#5EA4FF') : 'rgba(255, 255, 255, 0.75)'};
    box-shadow: ${({ $active, $categoryColor }) =>
      $active
        ? `0 0 0 1px ${$categoryColor || '#5EA4FF'}, 0 2px 10px rgba(0, 0, 0, 0.4)`
        : ringShadow.dark.mapChip};

    &:hover {
      color: ${({ $active, $categoryColor }) =>
        $active ? ($categoryColor || '#5EA4FF') : '#ffffff'};
      border-color: ${({ $active, $categoryColor }) =>
        $active ? ($categoryColor || '#5EA4FF') : 'rgba(255, 255, 255, 0.3)'};
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
  align?: 'start' | 'end';
}

export default function CategoryChips({ align = 'start' }: CategoryChipsProps) {
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);

  const items = CATEGORIES[mode];
  const containerRef = useRef<HTMLDivElement>(null);

  const isItemActive = useCallback(
    (item: CategoryItem) => {
      if (item.id === 'all') return !category || category === 'all';
      return category === item.id;
    },
    [category]
  );

  const handleChipClick = (item: CategoryItem) => {
    if (item.id === 'all' || category === item.id) {
      setCategory(null);
    } else {
      setCategory(item.id);
      if (!useMapStore.getState().panelOpen) {
        useMapStore.getState().setPanelOpen(true);
      }
    }
  };

  const updateEdgeFade = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--scroll-left', `${el.scrollLeft}px`);
  }, []);

  const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const container = containerRef.current;
    if (!container) return;
    dragRef.current = { startX: e.clientX, startScrollLeft: container.scrollLeft, moved: false };
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
        // ignore
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
        // ignore
      }
    }
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
            const isActive = isItemActive(item);
            const categoryColor = getCategoryActiveColor(item.id);
            return (
              <ChipWrap key={item.id}>
                <Chip
                  type="button"
                  $active={isActive}
                  $index={index}
                  $isEmphasis={item.isEmphasis}
                  $categoryColor={categoryColor}
                  aria-pressed={isActive}
                  onClick={() => handleChipClick(item)}
                >
                  {item.id === 'hanok' ? (
                    <HanokIcon size={20} />
                  ) : (
                    <HugeiconsIcon icon={item.icon} size={16} aria-hidden />
                  )}
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
