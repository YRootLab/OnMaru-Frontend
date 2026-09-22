import { ALL, EMPTY_FILTERS, type HanokFilters } from './hanokGridModel';













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

    activeBadges: badges ? badges.split(',').filter(Boolean) : [],
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}


export function toSearchParams(state: HanokFilterState): string {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set(KEYS.query, state.query.trim());
  if (state.region !== ALL) params.set(KEYS.region, state.region);
  if (state.activeType !== ALL) params.set(KEYS.type, state.activeType);
  if (state.activeBadges.length > 0) params.set(KEYS.badges, state.activeBadges.join(','));
  if (state.page > 1) params.set(KEYS.page, String(state.page));

  return params.toString();
}
