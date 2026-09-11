import { ALL, EMPTY_FILTERS, type HanokFilters } from './hanokGridModel';

/*
  필터를 주소창에 싣고 내린다.

  전에는 필터가 useState에만 있어서, 고택만 걸어 둔 화면을 링크로 보낼 수도 없고
  새로고침하면 사라졌다. 심사에서 특정 화면을 다시 열어 보여줄 방법이 없다는 뜻이다.

  next/navigation의 useSearchParams를 쓰지 않는다. 그쪽은 이 페이지를 Suspense로
  감싸야 하는 제약이 따라오는데, 여기서 필요한 건 주소창을 읽고 쓰는 것뿐이다.
  history.replaceState는 방문 기록을 늘리지 않아, 뒤로 가기가 필터 조작 하나하나를
  되짚지 않고 도감에 들어오기 전으로 한 번에 나간다.
*/

const KEYS = {
  query: 'q',
  region: 'region',
  type: 'type',
  badges: 'tags',
  page: 'page',
} as const;

export interface HanokFilterState extends HanokFilters {
  page: number;
}

export const EMPTY_STATE: HanokFilterState = { ...EMPTY_FILTERS, page: 1 };

export function readFilterState(search: string): HanokFilterState {
  const params = new URLSearchParams(search);
  const badges = params.get(KEYS.badges);
  const page = Number(params.get(KEYS.page));

  return {
    query: params.get(KEYS.query) ?? '',
    region: params.get(KEYS.region) || ALL,
    activeType: params.get(KEYS.type) || ALL,
    // 빈 조각(',,')이 빈 문자열 태그로 남으면 어떤 곳도 안 걸린다.
    activeBadges: badges ? badges.split(',').filter(Boolean) : [],
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** 기본값은 싣지 않는다. 아무것도 안 고른 상태의 주소는 /hanok 그대로여야 한다. */
export function toSearchParams(state: HanokFilterState): string {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set(KEYS.query, state.query.trim());
  if (state.region !== ALL) params.set(KEYS.region, state.region);
  if (state.activeType !== ALL) params.set(KEYS.type, state.activeType);
  if (state.activeBadges.length > 0) params.set(KEYS.badges, state.activeBadges.join(','));
  if (state.page > 1) params.set(KEYS.page, String(state.page));

  return params.toString();
}
