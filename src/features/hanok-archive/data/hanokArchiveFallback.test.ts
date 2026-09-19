import { describe, expect, it } from 'vitest';
import { HANOK_ARCHIVE_FALLBACK, decodeHanokArchivePayload } from './hanokArchiveFallback';

describe('HANOK_ARCHIVE_FALLBACK', () => {
  it('provides a non-empty internally consistent archive without waiting for TourAPI', () => {
    expect(HANOK_ARCHIVE_FALLBACK.villages.length).toBeGreaterThan(0);
    expect(HANOK_ARCHIVE_FALLBACK.meta.total).toBe(HANOK_ARCHIVE_FALLBACK.villages.length);
    expect(HANOK_ARCHIVE_FALLBACK.villages.every((village) => (
      village.image === null || village.image.startsWith('https://')
    ))).toBe(true);
  });
});

describe('decodeHanokArchivePayload', () => {
  it('accepts a non-empty live archive payload', () => {
    expect(decodeHanokArchivePayload(HANOK_ARCHIVE_FALLBACK)).toEqual(HANOK_ARCHIVE_FALLBACK);
  });

  it('rejects an empty response so a failed refresh cannot erase the snapshot', () => {
    expect(decodeHanokArchivePayload({
      villages: [],
      meta: { ...HANOK_ARCHIVE_FALLBACK.meta, total: 0 },
    })).toBeNull();
  });

  it('rejects a live response without regional data so the distribution chart stays visible', () => {
    expect(decodeHanokArchivePayload({
      villages: [{ ...HANOK_ARCHIVE_FALLBACK.villages[0], region: '' }],
      meta: { ...HANOK_ARCHIVE_FALLBACK.meta, total: 1 },
    })).toBeNull();
  });

  it('preserves the snapshot story when a live list response only supplies the address as summary', () => {
    const snapshotVillage = HANOK_ARCHIVE_FALLBACK.villages.find((village) => (
      village.id === '1055245'
    )) ?? HANOK_ARCHIVE_FALLBACK.villages[0];
    const decoded = decodeHanokArchivePayload({
      villages: [{ ...snapshotVillage, summary: snapshotVillage.addr, overview: '' }],
      meta: { ...HANOK_ARCHIVE_FALLBACK.meta, total: 1 },
    });

    expect(decoded?.villages[0].summary).toBe(snapshotVillage.summary);
    expect(decoded?.villages[0].summary).not.toBe(snapshotVillage.addr);
  });
});
