import { apiRequest, USE_MOCK } from '@/lib/api/client';
import type {
  InfoPlacePage,
  MapViewportResponse,
  ViewportRequestParams,
} from '@/features/map/types';

export interface ListInfoPlacesInput {
  category: string;
  regionCode?: string | null;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}

// ── Fixtures (BE 미준비 시 병렬 개발용) ──────────────────────────────────────

const FIXTURE_PLACES: InfoPlacePage = {
  query: { category: 'ALL' },
  snapshot: { id: 'fixture-snap-001', publishedAt: new Date().toISOString() },
  totalCount: 0,
  items: [],
  nextCursor: null,
  appliedCategories: ['HANOK', 'HISTORIC_SITE'],
  coverage: 'COMPLETE',
};

const FIXTURE_VIEWPORT: MapViewportResponse = {
  renderMode: 'DISTRICT',
  servedBbox: '126.0,34.0,130.0,38.5',
  snapshotId: 'fixture-snap-001',
  items: [],
  totalCountInViewport: 0,
};

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listInfoPlaces(input: ListInfoPlacesInput): Promise<InfoPlacePage> {
  if (USE_MOCK) return FIXTURE_PLACES;

  const params: Record<string, string> = {
    category: input.category.toUpperCase(),
    limit: String(input.limit ?? 30),
  };
  if (input.regionCode) params.regionCode = input.regionCode;
  if (input.cursor) params.cursor = input.cursor;

  return apiRequest<InfoPlacePage>('/map/info/places', {
    method: 'GET',
    params,
    signal: input.signal,
    retry: false,
  });
}

export async function loadMapViewport(
  params: ViewportRequestParams & { signal?: AbortSignal },
): Promise<MapViewportResponse> {
  if (USE_MOCK) return FIXTURE_VIEWPORT;

  const { signal, bbox, zoomLevel, category, regionCode } = params;
  const queryParams: Record<string, string> = {
    bbox,
    zoomLevel: String(zoomLevel),
    category: category.toUpperCase(),
  };
  if (regionCode) queryParams.regionCode = regionCode;

  return apiRequest<MapViewportResponse>('/map/info/viewport', {
    method: 'GET',
    params: queryParams,
    signal,
    retry: false,
  });
}
