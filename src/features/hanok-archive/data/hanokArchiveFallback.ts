import snapshot from '@/data/hanokVillages.fallback.json';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';

export interface HanokArchiveData {
  villages: Village[];
  meta: VillageMeta;
}

function toHttps(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url;
}

/*
  scripts/build-fallback.mjs가 만드는 그대로다 — { generatedAt, sourceTotals, villages }.
  villages 하나만 있는 배열이던 옛 스냅샷과 달리, 언제 만들었고(generatedAt) 관광공사
  원본이 몇 건이었는지(sourceTotals)까지 스냅샷 자신이 들고 있다. byType·badgeStats·
  imageRate·total은 그래도 villages에서 다시 센다 — 스냅샷을 손으로 잘라내도
  숫자가 항상 실제 배열과 맞아야 한다.
*/
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
    generatedAt: snapshot.generatedAt,
    total: items.length,
    byType,
    imageRate: items.length > 0 ? imageCount / items.length : 0,
    badgeStats,
    badgeFallbackCount: 0,
    sourceTotals: snapshot.sourceTotals,
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

  // The distribution section is driven by `region`. A partially degraded API
  // response used to replace the complete snapshot and then make the chart
  // disappear because HanokDistribution correctly renders nothing without
  // regional data. Keep the snapshot unless the live payload can support that
  // section as well.
  const hasRegionalData = candidate.villages.some((village) => (
    village
    && typeof village === 'object'
    && typeof (village as Partial<Village>).region === 'string'
    && Boolean((village as Partial<Village>).region?.trim())
  ));
  if (!hasRegionalData) return null;

  return candidate as HanokArchiveData;
}
