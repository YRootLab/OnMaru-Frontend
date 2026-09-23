import { apiGet } from '@/lib/api/client';

export interface BackendPlaceDetail {
  placeId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  images: { url: string; alt: string }[];
  description: string;
  highlights?: string[];
  contentTags: string[];
}

export async function fetchBackendHanokDetail(placeId: string): Promise<BackendPlaceDetail> {
  return apiGet<BackendPlaceDetail>(`/hanoks/${encodeURIComponent(placeId)}`);
}
