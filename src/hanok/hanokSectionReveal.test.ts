import { describe, expect, it } from 'vitest';
import { HANOK_REVEAL_SECTION_IDS } from './hanokSectionReveal';

describe('HANOK_REVEAL_SECTION_IDS', () => {
  it('defines one stable boundary for each major archive section', () => {
    expect(HANOK_REVEAL_SECTION_IDS).toEqual([
      'hanok-intro',
      'hanok-distribution',
      'hanok-monthly',
      'hanok-grid',
      'hanok-stay',
      'hanok-structure',
      'hanok-parts',
      'hanok-map',
      'hanok-manifesto',
    ]);
  });
});
