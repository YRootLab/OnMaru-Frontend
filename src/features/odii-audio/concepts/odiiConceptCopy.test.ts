import { describe, expect, it } from 'vitest';
import { ODII_CONCEPT_COPY } from './odiiConceptCopy';

describe('Odii concept copy', () => {
  it('uses one thesis and no decorative English eyebrow per concept', () => {
    expect(ODII_CONCEPT_COPY.sori.thesis).toBe('한국의 마음은 소리로 남습니다');
    expect(Object.values(ODII_CONCEPT_COPY).every(({ eyebrow }) => eyebrow === undefined)).toBe(true);
  });
});
