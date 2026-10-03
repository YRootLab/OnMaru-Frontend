import { MapLoadError, mapLoadErrorFromStatus, toMapLoadError } from '../application/mapLoadError';
import type { Item } from '../types';

export const MAP_LOAD_TIMEOUT_MS = 25_000;

export interface FetchMapPlacesParams {
  lat: number;
  lng: number;
  radius: number;
  category?: string | null;
}

export interface FetchMapPlacesResult {
  items: Item[];
  degraded: boolean;
  notice: string | null;
}

type FetchMapPlacesOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

type MapPlacesPayload = {
  items?: unknown;
  degraded?: unknown;
  error?: unknown;
};

function errorMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

export async function fetchMapPlaces(
  params: FetchMapPlacesParams,
  options: FetchMapPlacesOptions = {},
): Promise<FetchMapPlacesResult> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? MAP_LOAD_TIMEOUT_MS;
  const fetcher = options.fetcher ?? fetch;
  let timedOut = false;
  const onCallerAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });
  if (options.signal?.aborted) onCallerAbort();
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Map request timed out', 'TimeoutError'));
  }, timeoutMs);

  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius: String(params.radius),
  });
  if (params.category) query.set('category', params.category);

  try {
    const response = await fetcher(`/api/map/places?${query}`, { signal: controller.signal });
    const payload = await response.json().catch(() => ({})) as MapPlacesPayload;
    const items = Array.isArray(payload.items) ? payload.items as Item[] : [];
    const notice = errorMessage(payload.error) ?? null;
    const degraded = payload.degraded === true || Boolean(notice);

    if (items.length > 0) return { items, degraded, notice };
    if (!response.ok || notice) {
      const status = response.ok ? 500 : response.status;
      throw mapLoadErrorFromStatus(status, notice ?? response.statusText, payload.error);
    }
    return { items: [], degraded: false, notice: null };
  } catch (reason) {
    if (timedOut) {
      throw new MapLoadError('timeout', 408, 'Map request exceeded 25 seconds', reason);
    }
    if (options.signal?.aborted) {
      throw new DOMException('Map request cancelled', 'AbortError');
    }
    throw toMapLoadError(reason);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }
}
