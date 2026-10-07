import { apiRequest } from '@/lib/api/client';
import { normalizeInfoCategory } from '@/features/map/domain/infoCategory';
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
    category: normalizeInfoCategory(input.category).toUpperCase(),
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
  params: ViewportRequestParams & { signal?: AbortSignal; preferPlaces?: boolean },
): Promise<MapViewportResponse> {
  const { signal, bbox, zoomLevel, category, regionCode, preferPlaces } = params;
  const requestLevel = preferPlaces && zoomLevel <= 6 ? Math.min(4, zoomLevel) : zoomLevel;
  const response = await requestViewport({ bbox, zoomLevel: requestLevel, category, regionCode, signal });
  if (!preferPlaces || zoomLevel > 6 || response.renderMode === 'PLACE') return response;

  const bounds = bbox.split(',').map(Number);
  if (bounds.length !== 4 || bounds.some((value) => !Number.isFinite(value))) return response;

  const expand = async (tile: MapViewportResponse, tileBounds: number[], depth: number): Promise<ViewportItem[] | null> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (tile.snapshotId !== response.snapshotId) return null;
    if (tile.renderMode === 'PLACE') return tile.items;
    if (depth >= 2) return null;

    const [west, south, east, north] = tileBounds;
    const middleLng = (west + east) / 2;
    const middleLat = (south + north) / 2;
    const quarters = [
      [west, south, middleLng, middleLat],
      [middleLng, south, east, middleLat],
      [west, middleLat, middleLng, north],
      [middleLng, middleLat, east, north],
    ];
    const pieces = await Promise.all(quarters.map(async (quarter) => {
      const part = await requestViewport({
        bbox: quarter.join(','), zoomLevel: requestLevel, category, regionCode, signal,
      });
      return expand(part, quarter, depth + 1);
    }));
    if (pieces.some((piece) => piece === null)) return null;
    return pieces.flatMap((piece) => piece ?? []);
  };

  const places = await expand(response, bounds, 0);
  if (!places) return response;
  const unique = new Map(places.filter((item) => item.type === 'PLACE' && item.placeId)
    .map((item) => [item.placeId, item]));
  return {
    ...response,
    renderMode: 'PLACE',
    servedBbox: { west: bounds[0], south: bounds[1], east: bounds[2], north: bounds[3] },
    items: [...unique.values()],
    totalCountInViewport: unique.size,
  };
}

async function requestViewport(
  params: ViewportRequestParams & { signal?: AbortSignal },
): Promise<MapViewportResponse> {
  const { signal, bbox, zoomLevel, category, regionCode } = params;
  const queryParams: Record<string, string> = {
    bbox,
    zoomLevel: String(zoomLevel),
    category: normalizeInfoCategory(category).toUpperCase(),
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
