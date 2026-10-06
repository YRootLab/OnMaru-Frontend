'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar01Icon, Coffee01Icon, FlameIcon, HeartIcon, LandmarkIcon, Leaf01Icon, Moon01Icon, ShoppingBag01Icon, SparklesIcon, UsersIcon, UtensilsIcon } from '@hugeicons/core-free-icons'
import { transientProps } from '@/design-system/styled';
import { meok, palette, fontFamily, fontSize, ringShadow } from '@/design-system/tokens';

import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { MapInfoCategory, MapMode } from '@/features/map/types';
import { HanokIcon } from './HanokIcon';
import { useInfoMapHomeNavigation } from '@/features/map/presentation/useInfoMapHomeNavigation';

interface CategoryItem {
  id: string;
  label: string;
  keyword: string;
  icon: IconSvgElement;
  isEmphasis?: boolean;
}

const CATEGORIES: Record<MapMode, CategoryItem[]> = {
  info: [
    { id: 'hanok', label: '한옥', keyword: '한옥', icon: LandmarkIcon, isEmphasis: true },
    { id: 'stay', label: '숙소', keyword: '한옥스테이', icon: Moon01Icon },
    { id: 'food', label: '전통 맛집', keyword: '향토음식', icon: UtensilsIcon },
    { id: 'cafe', label: '전통 카페', keyword: '전통카페', icon: Coffee01Icon },
    { id: 'market', label: '전통 시장', keyword: '전통시장', icon: ShoppingBag01Icon },
    { id: 'spot', label: '고택', keyword: '고택', icon: LandmarkIcon },
    { id: 'culture', label: '문화유산', keyword: '서원', icon: LandmarkIcon },
    { id: 'experience', label: '전통 체험', keyword: '체험', icon: SparklesIcon },
    { id: 'festival', label: '축제', keyword: '축제', icon: Calendar01Icon },
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
  $isAll?: boolean;
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
  border: none;
  white-space: nowrap;
  cursor: pointer;
  opacity: 0;
  animation: ${chipPopIn} 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${({ $index }) => $index * 40}ms;

  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s ease,
    color 0.18s ease,
    font-weight 0.18s ease;

  /* 폰트: 전체 카테고리 칩 통일 */
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  font-size: ${fontSize.xs};
  letter-spacing: -0.02em;

  /* 배경 & 폰트 컬러:
     - 한옥 칩: 비선택 시 연한 주홍(juhong[300]), 선택(active) 시 메인 주홍(juhong[500]) 배경 + 흰색 폰트
     - 일반 칩: 기본 화이트/글래스 배경, 선택(active) 시 아이콘 & 폰트만 카테고리 색상 전환
  */
  background: ${({ $isEmphasis, $isAll, $active }) => {
    if ($isEmphasis) return $active ? palette.juhong[500] : palette.juhong[100];
    if ($isAll && $active) return meok[900];
    return 'rgba(255, 255, 255, 0.94)';
  }};
  border: none;
  color: ${({ $isEmphasis, $isAll, $active, $categoryColor }) => {
    if ($isEmphasis) return $active ? '#ffffff' : meok[900];
    if ($isAll && $active) return '#ffffff';
    if ($active) return $categoryColor || meok[900];
    return meok[700];
  }};
  box-shadow: ${ringShadow.light.mapChip};

  svg {
    flex-shrink: 0;
  }

  &:hover {
    /* 호버 시 폰트 굵게 */
    font-weight: 700;
    background: ${({ $isEmphasis, $isAll, $active }) => {
      if ($isEmphasis) return $active ? palette.juhong[600] : palette.juhong[200];
      if ($isAll && $active) return meok[800];
      return 'rgba(255, 255, 255, 0.94)';
    }};
    color: ${({ $isEmphasis, $isAll, $active, $categoryColor }) => {
      if ($isEmphasis) return $active ? '#ffffff' : meok[900];
      if ($isAll && $active) return '#ffffff';
      if ($active) return $categoryColor || meok[900];
      return meok[900];
    }};
    transform: translateY(-1px);
    box-shadow: ${ringShadow.light.buttonHover};
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${({ $isEmphasis }) => ($isEmphasis ? palette.juhong[500] : meok[900])};
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
    background: ${({ $isEmphasis, $isAll, $active }) => {
      if ($isEmphasis) return $active ? palette.juhong[500] : 'rgba(255, 85, 0, 0.14)';
      if ($isAll && $active) return 'rgba(255, 255, 255, 0.92)';
      return 'rgba(23, 30, 43, 0.92)';
    }};
    border: none;
    color: ${({ $isEmphasis, $isAll, $active, $categoryColor }) => {
      if ($isEmphasis) return $active ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
      if ($isAll && $active) return meok[900];
      if ($active) return $categoryColor || '#5EA4FF';
      return 'rgba(255, 255, 255, 0.75)';
    }};
    box-shadow: ${ringShadow.dark.mapChip};

    &:hover {
      background: ${({ $isEmphasis, $isAll, $active }) => {
        if ($isEmphasis) return $active ? palette.juhong[600] : 'rgba(255, 85, 0, 0.22)';
        if ($isAll && $active) return '#ffffff';
        return 'rgba(23, 30, 43, 0.92)';
      }};
      color: ${({ $isEmphasis, $isAll, $active, $categoryColor }) => {
        if ($isEmphasis) return $active ? '#ffffff' : '#ffffff';
        if ($isAll && $active) return meok[900];
        if ($active) return $categoryColor || '#5EA4FF';
        return '#ffffff';
      }};
      box-shadow: ${ringShadow.dark.buttonHover};
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
  const infoCategory = useMapStore((s) => s.infoCategory);
  const setInfoCategory = useMapStore((s) => s.setInfoCategory);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const {
    isInfoHome,
    captureBeforeNavigation,
    returnToInfoHome,
  } = useInfoMapHomeNavigation();

  const items = CATEGORIES[mode];
  const containerRef = useRef<HTMLDivElement>(null);

  const isItemActive = useCallback(
    (item: CategoryItem) => {
      if (mode === 'info') return infoCategory === item.id;
      if (item.id === 'all') return !category || category === 'all';
      return category === item.id;
    },
    [category, infoCategory, mode]
  );

  const handleChipClick = (item: CategoryItem) => {
    if (mode === 'info') {
      const nextCategory = item.id as MapInfoCategory;
      if (nextCategory === infoCategory) return;
      if (nextCategory === 'hanok' && !isInfoHome) {
        returnToInfoHome();
        return;
      }
      if (infoCategory === 'hanok') {
        captureBeforeNavigation();
      }
      setInfoCategory(nextCategory);
      setSearchQuery(item.keyword);
      if (!useMapStore.getState().panelOpen) {
        useMapStore.getState().setPanelOpen(true);
      }
      return;
    }

    const isDeselect = item.id === 'all' || category === item.id;
    if (isDeselect) {
      setCategory(null);
      // 검색창 초기화
      setSearchQuery('');
    } else {
      setCategory(item.id);
      setSheetSnap('half');
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
                  $isAll={item.id === 'all'}
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
