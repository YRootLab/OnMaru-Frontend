import snapshot from '@/data/hanokVillages.fallback.json';
import type { Village, VillageMeta } from '@/hanok/types';

export interface HanokArchiveData {
  villages: Village[];
  meta: VillageMeta;
}

function toHttps(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url;
}

const villages: Village[] = snapshot.map((item) => ({
  id: String(item.id),
  name: item.name,
  rawTitle: item.rawTitle,
  region: item.region,
  addr: item.addr,
  lat: Number.isFinite(item.lat) ? item.lat : null,
  lng: Number.isFinite(item.lng) ? item.lng : null,
  type: item.type,
  badges: item.badges,
  image: toHttps(item.image),
  hasImage: Boolean(item.image),
  summary: item.summary,
  overview: item.overview,
}));

function createMeta(items: Village[]): VillageMeta {
  const byType: Record<string, number> = {};
  const badgeStats: Record<string, number> = {};
  let imageCount = 0;

  for (const item of items) {
    byType[item.type] = (byType[item.type] ?? 0) + 1;
    if (item.hasImage) imageCount += 1;
    for (const badge of item.badges) {
      badgeStats[badge] = (badgeStats[badge] ?? 0) + 1;
    }
  }

  return {
    generatedAt: '2026-08-06T14:03:03.871Z',
    total: items.length,
    byType,
    imageRate: items.length > 0 ? imageCount / items.length : 0,
    badgeStats,
    badgeFallbackCount: 0,
  };
}

export const HANOK_ARCHIVE_FALLBACK: HanokArchiveData = {
  villages,
  meta: createMeta(villages),
};

export function decodeHanokArchivePayload(value: unknown): HanokArchiveData | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<HanokArchiveData>;
  if (!Array.isArray(candidate.villages) || candidate.villages.length === 0) return null;
  if (!candidate.meta || typeof candidate.meta.total !== 'number') return null;
  return candidate as HanokArchiveData;
}
