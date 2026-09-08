'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  IoStorefrontOutline,
  IoSparklesOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoHomeOutline,
  IoRestaurantOutline,
  IoCafeOutline,
  IoBagHandleOutline,
  IoFlameOutline,
  IoPeopleOutline,
  IoLeafOutline,
  IoHeartOutline,
} from 'react-icons/io5';
import { meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

interface CategoryItem {
  id: string;
  label: string;
  keyword: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
}

const CATEGORIES: Record<MapMode, CategoryItem[]> = {
  info: [
    { id: 'spot', label: '고택·명소', keyword: '고택', icon: IoStorefrontOutline },
    { id: 'experience', label: '한복·전통체험', keyword: '체험', icon: IoSparklesOutline },
    { id: 'culture', label: '문화재·서원', keyword: '서원', icon: IoBookOutline },
    { id: 'festival', label: '야행·축제', keyword: '축제', icon: IoCalendarOutline },
    { id: 'stay', label: '한옥숙소', keyword: '한옥스테이', icon: IoHomeOutline },
    { id: 'food', label: '향토음식', keyword: '향토음식', icon: IoRestaurantOutline },
    { id: 'cafe', label: '한옥카페·디저트', keyword: '한옥카페', icon: IoCafeOutline },
    { id: 'market', label: '전통시장', keyword: '전통시장', icon: IoBagHandleOutline },
  ],
  warmth: [
    { id: 'all', label: '모든 온기', keyword: '', icon: IoFlameOutline },
    { id: 'busy', label: '북적이는 곳', keyword: '북적', icon: IoPeopleOutline },
    { id: 'quiet', label: '한적한 곳', keyword: '한적', icon: IoLeafOutline },
    { id: 'today', label: '오늘의 온기', keyword: '오늘', icon: IoCalendarOutline },
    { id: 'mine', label: '내 온기', keyword: '내온기', icon: IoHeartOutline },
  ],
};

const chipPopIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Scroller = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 2px 4px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $index: number; $active: boolean }>`
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
  border: 1px solid ${({ $active }) => ($active ? meok[900] : 'rgba(25, 31, 40, 0.08)')};

  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active
      ? '0 4px 12px rgba(25, 31, 40, 0.2)'
      : '0 2px 6px rgba(0, 0, 0, 0.05)'};

  /* stagger pop-in: 마운트 시 순차 등장 */
  opacity: 0;
  animation: ${chipPopIn} 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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
    font-size: 12px;
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

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

export default function CategoryChips() {
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);
  const triggerSearch = useMapStore((s) => s.triggerSearch);

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

  return (
    <Scroller role="group" aria-label="카테고리 필터">
      {CATEGORIES[mode].map((item, index) => {
        const Icon = item.icon;
        const isActive =
          mode === 'warmth'
            ? (item.id === 'all' && (!category || category === 'all')) || category === item.id
            : category === item.id;

        return (
          <Chip
            key={item.id}
            type="button"
            $index={index}
            $active={isActive}
            aria-pressed={isActive}
            onClick={() => handleChipClick(item)}
          >
            <Icon size={16} aria-hidden />
            <span>{item.label}</span>
          </Chip>
        );
      })}
    </Scroller>
  );
}
