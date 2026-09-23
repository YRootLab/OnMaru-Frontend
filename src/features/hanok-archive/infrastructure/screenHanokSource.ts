import { apiGet, apiPut, apiDelete } from '@/lib/api/client';
import type { ScreenHanokItem, ScreenHanokFilterParams } from '@/features/hanok-archive/data/screenHanokFallback';

interface ScreenHanokResponse {
  total: number;
  items: ScreenHanokItem[];
}

export async function fetchBackendScreenHanoks(
  params?: ScreenHanokFilterParams,
): Promise<ScreenHanokItem[]> {
  const queryParams: Record<string, string> = {};
  if (params?.region) queryParams.region = params.region;
  if (params?.mediaType) queryParams.mediaType = params.mediaType;

  const res = await apiGet<ScreenHanokResponse>('/api/v1/hanoks/screen-hanok', queryParams);
  return Array.isArray(res?.items) ? res.items : [];
}

export async function saveScreenHanokPlace(placeId: string): Promise<void> {
  await apiPut(`/api/v1/saved-resources/places/${encodeURIComponent(placeId)}`, {});
}

export async function unsaveScreenHanokPlace(placeId: string): Promise<void> {
  await apiDelete(`/api/v1/saved-resources/places/${encodeURIComponent(placeId)}`);
}
