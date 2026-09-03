'use client';

import styled from '@emotion/styled';
import {
  Coffee,
  Flame,
  Landmark,
  Leaf,
  Home,
  MessageCircle,
  Sparkles,
  Store,
  Users,
  Utensils,
  LayoutGrid,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { MapMode } from '@/map/types';

const CATEGORIES: Record<MapMode, { id: string; label: string; icon: LucideIcon }[]> = {
  info: [
    { id: 'all', label: '전체', icon: LayoutGrid },
    { id: 'spot', label: '고택·명소', icon: Landmark },
    { id: 'experience', label: '한복·전통체험', icon: Sparkles },
    { id: 'culture', label: '문화재·서원', icon: BookOpen },
    { id: 'stay', label: '한옥숙소', icon: Home },
    { id: 'food', label: '향토음식', icon: Utensils },
    { id: 'cafe', label: '한옥카페·디저트', icon: Coffee },
    { id: 'market', label: '전통시장', icon: Store },
  ],
  warmth: [
    { id: 'all', label: '모든 온기', icon: Flame },
    { id: 'busy', label: '북적이는 곳', icon: Users },
    { id: 'quiet', label: '한적한 곳', icon: Leaf },
    { id: 'today', label: '오늘의 온기', icon: Sparkles },
    { id: 'review', label: '한줄평', icon: MessageCircle },
  ],
};

const Scroller = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $active: boolean }>`
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;

  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.94)')};
  backdrop-filter: blur(16px);

  color: ${({ $active }) => ($active ? '#FFFFFF' : meok[700])};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-1px);
    background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    color: ${({ $active }) => ($active ? '#FFFFFF' : meok[900])};
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }
`;

export default function CategoryChips() {
  const mode = useMapStore((s) => s.mode);
  const category = useMapStore((s) => s.category);
  const setCategory = useMapStore((s) => s.setCategory);

  const handleChipClick = (id: string) => {
    if (id === 'all') {
      setCategory(null);
    } else {
      setCategory(category === id ? null : id);
    }
  };

  return (
    <Scroller role="group" aria-label="카테고리 필터">
      {CATEGORIES[mode].map(({ id, label, icon: Icon }) => {
        const active =
          id === 'all'
            ? category === null || category === 'all'
            : category === id;

        return (
          <Chip
            key={id}
            type="button"
            aria-pressed={active}
            $active={active}
            onClick={() => handleChipClick(id)}
          >
            <Icon size={16} aria-hidden />
            {label}
          </Chip>
        );
      })}
    </Scroller>
  );
}

