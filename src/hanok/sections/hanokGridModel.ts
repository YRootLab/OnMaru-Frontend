import { STAY_TYPE } from '@/hanok/types';
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
    // 스테이는 아래 '지역별 고택 스테이' 섹션이 따로 맡는다. 여기서 빼지 않으면
    // 같은 100곳이 두 번 세어져 도감 곳수와 전체 수집분의 합이 어긋난다.
    if (village.type === STAY_TYPE) return false;
    if (activeType !== '전체' && village.type !== activeType) return false;
    /*
      고른 태그 중 하나라도 걸리면 남긴다.

      전에는 every였다 — 고른 태그를 전부 가진 곳만 남겼다. 수집분의 태그 분포가
      세계유산 1곳, 돌담길 2곳, 궁궐 3곳처럼 희박해서, 두 개만 눌러도 교집합이
      사실상 비었다. 태그 칩은 좁히는 장치가 아니라 넓히는 장치로 읽히므로
      '둘 다'가 아니라 '둘 중 아무거나'가 맞다.
    */
    return activeBadges.length === 0 || activeBadges.some((badge) => village.badges.includes(badge));
  });
  const safePage = Math.max(1, currentPage);

  return {
    items: filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    filteredCount: filtered.length,
  };
}
