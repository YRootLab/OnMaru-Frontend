import { apiGet } from '@/lib/api/client';

export interface BackendHanokItem {
  placeId: string;
  name: string;
  category: string;
  regionName: string;
  thumbnailUrl: string | null;
  summary: string;
  tags: string[];
}

interface BackendHanokListResponse {
  items: BackendHanokItem[];
}

export async function fetchBackendHanoks(): Promise<BackendHanokItem[]> {
  const res = await apiGet<BackendHanokListResponse>('/hanoks', { limit: 50 });
  return res.items;
}
