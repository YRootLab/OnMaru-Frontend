import type { VisitReview, VisitReviewPage } from '../api/visitReviewContract';

export type VisitReviewListState = {
  selectedRegionCode: string | null;
  activeRequestSeq: number | null;
  reviews: VisitReview[];
  nextCursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
};

export type VisitReviewListEvent =
  | { type: 'region-load-started'; requestSeq: number; regionCode: string }
  | { type: 'region-load-succeeded'; requestSeq: number; page: VisitReviewPage }
  | { type: 'region-load-failed'; requestSeq: number; error: string };

export function createInitialVisitReviewListState(): VisitReviewListState {
  return {
    selectedRegionCode: null,
    activeRequestSeq: null,
    reviews: [],
    nextCursor: null,
    hasMore: false,
    loading: false,
    error: null,
  };
}

export function reduceVisitReviewListState(
  state: VisitReviewListState,
  event: VisitReviewListEvent,
): VisitReviewListState {
  switch (event.type) {
    case 'region-load-started':
      return {
        ...state,
        selectedRegionCode: event.regionCode,
        activeRequestSeq: event.requestSeq,
        loading: true,
        error: null,
      };
    case 'region-load-succeeded':
      if (event.requestSeq !== state.activeRequestSeq) return state;
      return {
        ...state,
        reviews: event.page.items,
        nextCursor: event.page.nextCursor,
        hasMore: event.page.hasMore,
        loading: false,
        error: null,
      };
    case 'region-load-failed':
      if (event.requestSeq !== state.activeRequestSeq) return state;
      return {
        ...state,
        loading: false,
        error: event.error,
      };
  }
}
