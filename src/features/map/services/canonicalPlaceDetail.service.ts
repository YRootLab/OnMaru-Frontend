import { apiRequest } from '@/lib/api/client';
import type { PlaceDetailData } from '@/features/map/types';

interface CanonicalPlaceDetailResponse {
  placeId: string;
  name: string;
  category?: string;
  region?: { regionCode: string; name: string };
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  images: Array<{ url: string; alt?: string }>;
  description: string;
  contentTags: string[];
}

export async function loadCanonicalPlaceDetail(
  placeId: string,
  signal?: AbortSignal,
): Promise<PlaceDetailData> {
  const response = await apiRequest<CanonicalPlaceDetailResponse>(
    `/places/${encodeURIComponent(placeId)}`,
    {
      method: 'GET',
      cache: 'no-store',
      signal,
      retry: false,
    },
  );

  return {
    contentId: response.placeId,
    contentTypeId: response.category ?? '',
    title: response.name,
    overview: response.description,
    addr1: response.address ?? response.region?.name ?? '',
    images: response.images.map((image) => image.url).filter(Boolean),
    mapx: response.coordinates?.lng ?? 0,
    mapy: response.coordinates?.lat ?? 0,
    tel: null,
    intro: {},
    homepage: null,
    contentTags: response.contentTags,
  };
}
