import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village } from '@/features/hanok-archive/types';

/*
  도감을 거르는 한 벌.

  전에는 유형과 태그만 있었고, 지역은 지도와 스테이가 각자 따로 갖고 있었다. 같은 707곳을
  세 벌의 다른 필터로 보던 셈이다. 거르는 규칙을 여기 한 곳에 모아, 나중에 지도와 스테이가
  같은 결과를 보여주는 다른 얼굴이 될 수 있게 둔다.

  이름 검색이 없으면 707곳에서 한 곳을 찾는 길이 23페이지를 눈으로 넘기는 것뿐이었다.
  도감은 찾는 책이므로 검색은 부가 기능이 아니다.
*/

export interface HanokFilters {
  /** 이름·주소에 걸리는 말. 빈 문자열이면 안 거른다. */
  query: string;
  /** '전체' 또는 시도 이름. village.region과 완전일치한다. */
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

/**
 * 검색어와 대상을 같은 모양으로 눕힌다.
 *
 * '남산골 한옥마을'과 '남산골한옥마을'은 같은 곳을 가리키는데 공백 하나로 안 걸린다.
 * 사람이 띄어쓰기를 정확히 맞출 이유가 없으므로 양쪽에서 공백을 걷고 견준다.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

export function filterHanoks(villages: Village[], filters: HanokFilters): Village[] {
  const { query, region, activeType, activeBadges } = filters;
  const needle = normalize(query);

  return villages.filter((village) => {
    // 스테이는 '지역별 고택 스테이' 섹션이 따로 맡는다. 여기서 빼지 않으면 같은 곳이
    // 두 번 세어져 도감 곳수와 전체 수집분의 합이 어긋난다.
    if (village.type === STAY_TYPE) return false;
    if (activeType !== ALL && village.type !== activeType) return false;
    if (region !== ALL && village.region !== region) return false;

    // 이름으로 못 찾으면 주소로도 찾을 수 있어야 한다 ('안동'으로 안동의 한옥들이 걸린다).
    if (needle && !normalize(`${village.name} ${village.addr}`).includes(needle)) return false;

    /*
      고른 태그 중 하나라도 걸리면 남긴다.

      전에는 every였다 — 고른 태그를 전부 가진 곳만 남겼다. 수집분의 태그 분포가
      희박해서 두 개만 눌러도 교집합이 사실상 비었다. 태그 칩은 좁히는 장치가 아니라
      넓히는 장치로 읽히므로 '둘 다'가 아니라 '둘 중 아무거나'가 맞다.
    */
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

  /*
    거르고 나서 남은 쪽수보다 뒤에 서 있으면 마지막 쪽으로 끌어온다.

    5쪽을 보다가 검색어를 넣어 결과가 2쪽으로 줄면, 5쪽은 빈 배열을 돌려준다 —
    조건에 맞는 곳이 있는데도 '없습니다'가 뜬다.
  */
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  return {
    items: filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    totalPages,
    filteredCount: filtered.length,
  };
}
