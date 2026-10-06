import type { Village, VillageMeta } from '@/features/hanok-archive/types';

export type HanokArchiveCollection = { villages: Village[]; meta: VillageMeta };

function countByType(villages: Village[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const village of villages) {
    counts.set(village.type, (counts.get(village.type) ?? 0) + 1);
  }
  return counts;
}

function rebuildMeta(villages: Village[], incoming: VillageMeta): VillageMeta {
  const byType: Record<string, number> = {};
  const badgeStats: Record<string, number> = {};
  let imageCount = 0;

  for (const village of villages) {
    byType[village.type] = (byType[village.type] ?? 0) + 1;
    if (village.hasImage) imageCount += 1;
    for (const badge of village.badges) {
      badgeStats[badge] = (badgeStats[badge] ?? 0) + 1;
    }
  }

  return {
    ...incoming,
    total: villages.length,
    byType,
    badgeStats,
    imageRate: villages.length > 0 ? Math.round((imageCount / villages.length) * 100) : 0,
  };
}

export function reconcileArchiveCollection(
  current: HanokArchiveCollection,
  incoming: HanokArchiveCollection,
): HanokArchiveCollection {
  const currentCounts = countByType(current.villages);
  const incomingCounts = countByType(incoming.villages);
  const incompleteTypes = new Set(
    [...currentCounts].flatMap(([type, count]) => (
      (incomingCounts.get(type) ?? 0) < count ? [type] : []
    )),
  );

  if (incompleteTypes.size === 0) return incoming;

  const villages = [...incoming.villages];
  const incomingIds = new Set(villages.map((village) => village.id));
  for (const village of current.villages) {
    if (incompleteTypes.has(village.type) && !incomingIds.has(village.id)) {
      villages.push(village);
    }
  }

  return { villages, meta: rebuildMeta(villages, incoming.meta) };
}
