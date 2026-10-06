import { apiGet } from '@/lib/api/client';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { STAY_TYPE } from '@/features/hanok-archive/domain/village';
import { HANOK_ARCHIVE_FALLBACK } from '@/features/hanok-archive/data/hanokArchiveFallback';

export interface BackendHanokItem {
  placeId: string;
  name: string;
  category: string;
  regionName: string;
  thumbnailUrl: string | null;
  summary: string;
  tags: string[];
  lat?: number | null;
  lng?: number | null;
}

interface BackendHanokListResponse {
  items: BackendHanokItem[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export async function fetchBackendHanoks(): Promise<BackendHanokItem[]> {
  const all: BackendHanokItem[] = [];
  let cursor: string | undefined;
  do {
    const res = await apiGet<BackendHanokListResponse>('/hanoks', {
      limit: 50,
      ...(cursor ? { cursor } : {}),
    });
    all.push(...res.items);
    if (!res.hasMore || !res.nextCursor) break;
    cursor = res.nextCursor;
  } while (true);
  return all;
}

const fallbackById = new Map(
  HANOK_ARCHIVE_FALLBACK.villages.map((v) => [v.id, v]),
);

function toVillage(item: BackendHanokItem): Village {
  const snap = fallbackById.get(item.placeId);
  return {
    id: item.placeId,
    name: item.name,
    rawTitle: item.name,
    region: item.regionName,
    addr: snap?.addr || '',
    lat: item.lat ?? snap?.lat ?? null,
    lng: item.lng ?? snap?.lng ?? null,
    type: item.category === 'HANOK_STAY' ? STAY_TYPE : item.category,
    badges: item.tags,
    image: item.thumbnailUrl,
    hasImage: item.thumbnailUrl !== null,
    summary: item.summary || snap?.summary || '',
    overview: snap?.overview || '',
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
