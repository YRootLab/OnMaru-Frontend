import type { Village } from '@/hanok/types';

export interface HanokGridFilters {
  activeType: string;
  activeBadges: string[];
}

export interface HanokGridPage {
  items: Village[];
  totalPages: number;
  filteredCount: number;
}

const ITEMS_PER_PAGE = 12;

export function getHanokGridPage(
  villages: Village[],
  { activeType, activeBadges }: HanokGridFilters,
  currentPage: number,
): HanokGridPage {
  const filtered = villages.filter((village) => {
    if (village.type === '한옥 고택 스테이') return false;
    if (activeType !== '전체' && village.type !== activeType) return false;
    return activeBadges.length === 0 || activeBadges.every((badge) => village.badges.includes(badge));
  });
  const safePage = Math.max(1, currentPage);

  return {
    items: filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    filteredCount: filtered.length,
  };
}
