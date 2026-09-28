import snapshot from '@/data/hanokVillages.fallback.json';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';

function toSecureImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
}

function createVillageMeta(
  villages: Village[],
  generatedAt: string,
  sourceTotals?: Record<string, number>,
): VillageMeta {
  const byType: Record<string, number> = {};
  const badgeStats: Record<string, number> = {};
  let imageCount = 0;
  const badgeFallbackCount = 0;

  villages.forEach((v) => {
    byType[v.type] = (byType[v.type] || 0) + 1;
    if (v.hasImage) imageCount += 1;
    v.badges.forEach((badge) => {
      badgeStats[badge] = (badgeStats[badge] || 0) + 1;
    });
  });

  return {
    generatedAt,
    total: villages.length,
    byType,
    imageRate: villages.length > 0 ? Math.round((imageCount / villages.length) * 100) : 0,
    badgeStats,
    badgeFallbackCount,
    sourceTotals,
  };
}

export interface HanokArchiveData {
  villages: Village[];
  meta: VillageMeta;
}

const villages: Village[] = snapshot.villages.map((item) => ({
  id: String(item.id),
  name: item.name,
  rawTitle: item.rawTitle,
  region: item.region,
  addr: item.addr,
  lat: Number.isFinite(item.lat) ? item.lat : null,
  lng: Number.isFinite(item.lng) ? item.lng : null,
  type: item.type as Village['type'],
  badges: item.badges,
  image: toSecureImageUrl(item.image),
  hasImage: Boolean(item.image),
  summary: item.summary,
  overview: item.overview,
}));

export const HANOK_ARCHIVE_FALLBACK: HanokArchiveData = {
  villages,
  meta: createVillageMeta(villages, snapshot.generatedAt, snapshot.sourceTotals),
};

const fallbackVillageById = new Map(villages.map((village) => [village.id, village]));

function normalizeComparableText(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function preserveSnapshotDescription(village: Village): Village {
  const snapshotVillage = fallbackVillageById.get(village.id);
  if (!snapshotVillage) return village;

  const liveSummary = village.summary?.trim() ?? '';
  const summaryIsAddress = normalizeComparableText(liveSummary) === normalizeComparableText(village.addr ?? '');

  return {
    ...village,
    summary: (!liveSummary || summaryIsAddress) && snapshotVillage.summary
      ? snapshotVillage.summary
      : liveSummary,
    overview: village.overview?.trim() || snapshotVillage.overview,
  };
}

export function decodeHanokArchivePayload(value: unknown): HanokArchiveData | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<HanokArchiveData>;
  if (!Array.isArray(candidate.villages) || candidate.villages.length === 0) return null;
  if (!candidate.meta || typeof candidate.meta.total !== 'number') return null;






  const hasRegionalData = candidate.villages.some((village) => (
    village
    && typeof village === 'object'
    && typeof (village as Partial<Village>).region === 'string'
    && Boolean((village as Partial<Village>).region?.trim())
  ));
  if (!hasRegionalData) return null;

  return {
    ...(candidate as HanokArchiveData),
    villages: (candidate.villages as Village[]).map(preserveSnapshotDescription),
  };
}
