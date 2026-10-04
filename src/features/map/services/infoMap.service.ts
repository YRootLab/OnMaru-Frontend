import { apiRequest, USE_MOCK } from '@/lib/api/client';
import type {
  InfoPlacePage,
  MapViewportResponse,
  ViewportItemBounds,
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
  servedBbox: { west: 126, south: 34, east: 130, north: 38.5 },
  snapshotId: 'fixture-snap-001',
  items: [],
  totalCountInViewport: 0,
};

function isViewportBounds(value: unknown): value is ViewportItemBounds {
  if (!value || typeof value !== 'object') return false;
  const bounds = value as Partial<ViewportItemBounds>;
  return [bounds.west, bounds.south, bounds.east, bounds.north]
    .every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
}

function parseMapViewportResponse(value: unknown): MapViewportResponse {
  if (!value || typeof value !== 'object') throw new Error('Invalid map viewport response');
  const response = value as Partial<MapViewportResponse>;
  if (
    !['REGION', 'DISTRICT', 'CLUSTER', 'PLACE'].includes(response.renderMode ?? '')
    || !isViewportBounds(response.servedBbox)
    || !Array.isArray(response.items)
    || (response.snapshotId !== null && typeof response.snapshotId !== 'string')
  ) {
    throw new Error('Invalid map viewport response');
  }
  return response as MapViewportResponse;
}

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
    limit: '60',
  };
  if (regionCode) queryParams.regionCode = regionCode;

  const response = await apiRequest<unknown>('/map/info/viewport', {
    method: 'GET',
    params: queryParams,
    signal,
    retry: false,
  });
  return parseMapViewportResponse(response);
}
