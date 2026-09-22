import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village } from '@/features/hanok-archive/types';












export interface HanokFilters {

  query: string;

  region: string;
  activeType: string;
  activeBadges: string[];
}

export interface HanokGridPage {
  items: Village[];
  totalPages: number;
  filteredCount: number;
}

export const ALL = '전체';

export const EMPTY_FILTERS: HanokFilters = {
  query: '',
  region: ALL,
  activeType: ALL,
  activeBadges: [],
};

const ITEMS_PER_PAGE = 12;







function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

export function filterHanoks(villages: Village[], filters: HanokFilters): Village[] {
  const { query, region, activeType, activeBadges } = filters;
  const needle = normalize(query);

  return villages.filter((village) => {


    if (village.type === STAY_TYPE) return false;
    if (activeType !== ALL && village.type !== activeType) return false;
    if (region !== ALL && village.region !== region) return false;


    if (needle && !normalize(`${village.name} ${village.addr}`).includes(needle)) return false;








    return activeBadges.length === 0 || activeBadges.some((badge) => village.badges.includes(badge));
  });
}

export function getHanokGridPage(
  villages: Village[],
  filters: HanokFilters,
  currentPage: number,
): HanokGridPage {
  const filtered = filterHanoks(villages, filters);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);







  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  return {
    items: filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    totalPages,
    filteredCount: filtered.length,
  };
}
