import { describe, expect, it } from 'vitest';
import { ODII_CONCEPTS, getOdiiConceptMeta, isOdiiConcept } from './odiiConcept';

describe('Odii concept model', () => {
  it('keeps the three approved concepts in comparison order', () => {
    expect(ODII_CONCEPTS).toEqual(['sori', 'hanji', 'studio']);
  });

  it('rejects unsupported route values', () => {
    expect(isOdiiConcept('sori')).toBe(true);
    expect(isOdiiConcept('unknown')).toBe(false);
  });

  it('uses user-facing Korean names without production labels', () => {
    expect(getOdiiConceptMeta('sori').title).toBe('소리로 듣는 한국');
    expect(getOdiiConceptMeta('hanji').title).toBe('디지털 한지 아카이브');
    expect(getOdiiConceptMeta('studio').title).toBe('프리미엄 오디오 스튜디오');
  });
});
