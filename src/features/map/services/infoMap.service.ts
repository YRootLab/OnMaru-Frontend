import { apiRequest } from '@/lib/api/client';
import type {
  InfoPlacePage,
  ViewportItem,
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
  return {
    ...response,
    items: response.items.map((rawItem) => {
      const item = rawItem as ViewportItem & { id?: string; displayCategory?: string; name?: string | null };
      return {
        ...item,
        name: item.name?.trim() || (item.type === 'CLUSTER' ? '주변 장소' : '장소'),
        clusterId: item.clusterId ?? (item.type === 'CLUSTER' ? item.id : undefined),
        category: item.category ?? item.displayCategory,
      };
    }),
  } as MapViewportResponse;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listInfoPlaces(input: ListInfoPlacesInput): Promise<InfoPlacePage> {
  const params: Record<string, string> = {
    category: input.category.toUpperCase(),
    limit: String(input.limit ?? 30),
  };
  if (input.regionCode) params.regionCode = input.regionCode;
  if (input.cursor) params.cursor = input.cursor;

  const page = await apiRequest<InfoPlacePage>('/map/info/places', {
    method: 'GET',
    params,
    signal: input.signal,
    retry: false,
  });
  return {
    ...page,
    items: page.items.map((item) => ({
      ...item,
      category: item.displayCategory ?? item.category,
    })),
  };
}

export async function loadMapViewport(
  params: ViewportRequestParams & { signal?: AbortSignal },
): Promise<MapViewportResponse> {
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
