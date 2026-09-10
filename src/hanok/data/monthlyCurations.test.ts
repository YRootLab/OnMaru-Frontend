import { describe, expect, it } from 'vitest';
import { MONTHLY_CURATIONS } from './monthlyCurations.mjs';
import { HANOK_ARCHIVE_FALLBACK } from './hanokArchiveFallback';

/*
  이달의 한옥(HanokMonthly.tsx)은 pinned contentId를 스냅샷에서 못 찾으면 섹션을
  숨긴다(villages[0]로 채우지 않는다) — 그래서 이 테스트가 실패해도 화면이 깨지지는
  않는다. 다만 실패한 달에는 라이브 fetch가 안 되는 동안(또는 실패한 채로) 그 달의
  큐레이션 글이 한 번도 화면에 뜨지 않는다는 뜻이라, scripts/build-fallback.mjs가
  스냅샷을 다시 만들 때 12개월을 전부 채우도록 이 테스트로 경고한다.
*/
describe('MONTHLY_CURATIONS ↔ 폴백 스냅샷 정합성', () => {
  const idsInFallback = new Set(HANOK_ARCHIVE_FALLBACK.villages.map((v) => v.id));

  it.each(Object.entries(MONTHLY_CURATIONS))(
    '%s월 큐레이션 contentId가 폴백 스냅샷에 존재한다',
    (month, curation) => {
      expect(idsInFallback.has(curation.contentId)).toBe(true);
    },
  );
});
