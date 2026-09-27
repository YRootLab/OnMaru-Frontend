import { apiGet } from '@/lib/api/client';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';

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

function toVillage(item: BackendHanokItem): Village {
  return {
    id: item.placeId,
    name: item.name,
    rawTitle: item.name,
    region: item.regionName,
    addr: '',
    lat: null,
    lng: null,
    type: item.category,
    badges: item.tags,
    image: item.thumbnailUrl,
    hasImage: item.thumbnailUrl !== null,
    summary: item.summary,
    overview: '',
  };
}

function buildMeta(villages: Village[]): VillageMeta {
  const byType: Record<string, number> = {};
  const badgeStats: Record<string, number> = {};
  let imageCount = 0;
  villages.forEach((v) => {
    byType[v.type] = (byType[v.type] || 0) + 1;
    if (v.hasImage) imageCount += 1;
    v.badges.forEach((b) => { badgeStats[b] = (badgeStats[b] || 0) + 1; });
  });
  return {
    generatedAt: new Date().toISOString(),
    total: villages.length,
    byType,
    imageRate: villages.length > 0 ? Math.round((imageCount / villages.length) * 100) : 0,
    badgeStats,
    badgeFallbackCount: 0,
  };
}

export async function fetchBackendHanoksAsArchive(): Promise<{ villages: Village[]; meta: VillageMeta }> {
  const items = await fetchBackendHanoks();
  const villages = items.map(toVillage);
  return { villages, meta: buildMeta(villages) };
}
