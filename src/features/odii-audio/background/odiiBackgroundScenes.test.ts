import { describe, expect, it } from 'vitest';
import {
  getOdiiTearBoundaries,
  ODII_BACKGROUND_STAGES,
  resolveOdiiBackgroundCategory,
  resolveOdiiBackgroundScene,
} from './odiiBackgroundScenes';

describe('Odii background scene model', () => {
  it('maps only approved Odii themes to restrained category modifiers', () => {
    expect(resolveOdiiBackgroundCategory('한옥')).toBe('hanok');
    expect(resolveOdiiBackgroundCategory('시장')).toBe('market');
    expect(resolveOdiiBackgroundCategory('마을')).toBe('village');
    expect(resolveOdiiBackgroundCategory('궁')).toBe('palace');
    expect(resolveOdiiBackgroundCategory('길')).toBe('nature');
    expect(resolveOdiiBackgroundCategory('서울')).toBe('default');
  });

  it('limits strong tear boundaries to the approved variants and stages', () => {
    expect(getOdiiTearBoundaries('warmth-grain')).toEqual([]);
    expect(getOdiiTearBoundaries('changho-breeze')).toEqual([]);
    expect(getOdiiTearBoundaries('hanji-journey')).toEqual(['nearby', 'archive']);
    expect(getOdiiTearBoundaries('onmaru-signature')).toEqual(['archive']);
  });

  it('resolves a complete scene for every stable Odii stage', () => {
    expect(ODII_BACKGROUND_STAGES).toEqual([
      'featured',
      'themes',
      'nearby',
      'related',
      'archive',
      'collection',
      'closing',
    ]);

    expect(resolveOdiiBackgroundScene('onmaru-signature', 'nearby', '시장')).toMatchObject({
      variant: 'onmaru-signature',
      stage: 'nearby',
      category: 'market',
      motif: 'leaf',
    });
    expect(resolveOdiiBackgroundScene('warmth-grain', 'archive', '전체').motionLevel).toBe('quiet');
  });
});
