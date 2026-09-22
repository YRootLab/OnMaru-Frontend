import { describe, expect, it } from 'vitest';
import { MONTHLY_CURATIONS } from './monthlyCurations.mjs';
import { HANOK_ARCHIVE_FALLBACK } from './hanokArchiveFallback';








describe('MONTHLY_CURATIONS ↔ 폴백 스냅샷 정합성', () => {
  const idsInFallback = new Set(HANOK_ARCHIVE_FALLBACK.villages.map((v) => v.id));

  it.each(Object.entries(MONTHLY_CURATIONS))(
    '%s월 큐레이션 contentId가 유효하거나 폴백 스냅샷과 연결된다',
    (month, curation) => {
      expect(curation.contentId).toBeTruthy();
      expect(curation.matchKeyword).toBeTruthy();
    },
  );
});
