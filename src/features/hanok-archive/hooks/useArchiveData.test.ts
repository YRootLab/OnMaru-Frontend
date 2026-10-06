import { describe, expect, it } from 'vitest';
import { HANOK_ARCHIVE_FALLBACK } from '@/features/hanok-archive/data/hanokArchiveFallback';
import { reconcileArchiveCollection } from '@/features/hanok-archive/domain/reconcileArchiveCollection';

describe('reconcileArchiveCollection', () => {
  it('preserves missing records while accepting fresh records from a partial response', () => {
    const freshVillage = {
      ...HANOK_ARCHIVE_FALLBACK.villages[0],
      name: '백엔드에서 갱신된 이름',
    };
    const partial = {
      villages: [freshVillage, ...HANOK_ARCHIVE_FALLBACK.villages.slice(1, 7)],
      meta: { ...HANOK_ARCHIVE_FALLBACK.meta, total: 7 },
    };

    const result = reconcileArchiveCollection(HANOK_ARCHIVE_FALLBACK, partial);

    expect(result.villages.find((village) => village.id === freshVillage.id)?.name)
      .toBe('백엔드에서 갱신된 이름');
    expect(result.meta.total).toBe(HANOK_ARCHIVE_FALLBACK.meta.total);
    expect(result.meta.byType['한옥스테이']).toBe(80);
  });

  it('does not accept stays while silently dropping every non-stay category', () => {
    const staysOnly = HANOK_ARCHIVE_FALLBACK.villages.filter((village) => village.type === '한옥스테이');
    const result = reconcileArchiveCollection(HANOK_ARCHIVE_FALLBACK, {
      villages: staysOnly,
      meta: { ...HANOK_ARCHIVE_FALLBACK.meta, total: staysOnly.length },
    });

    expect(result.meta.total).toBe(HANOK_ARCHIVE_FALLBACK.meta.total);
    expect(result.meta.byType['고택']).toBe(HANOK_ARCHIVE_FALLBACK.meta.byType['고택']);
  });

  it('accepts a complete incoming collection unchanged', () => {
    const result = reconcileArchiveCollection(HANOK_ARCHIVE_FALLBACK, HANOK_ARCHIVE_FALLBACK);

    expect(result).toBe(HANOK_ARCHIVE_FALLBACK);
  });
});
