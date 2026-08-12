import { describe, expect, it } from 'vitest';
import {
  getOdiiTearBoundaries,
  ODII_BACKGROUND_STAGES,
  resolveOdiiBackgroundCategory,
  resolveOdiiBackgroundPresentation,
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

  it('gives each comparison route a different restrained material emphasis', () => {
    expect(resolveOdiiBackgroundPresentation('warmth-grain')).toMatchObject({
      warmthField: 1,
      thresholdShadow: 0.18,
      paperDepth: 0.22,
    });
    expect(resolveOdiiBackgroundPresentation('changho-breeze')).toMatchObject({
      warmthField: 0.28,
      thresholdShadow: 1,
      paperDepth: 0.18,
    });
    expect(resolveOdiiBackgroundPresentation('hanji-journey')).toMatchObject({
      warmthField: 0.2,
      thresholdShadow: 0.22,
      paperDepth: 1,
    });
    expect(resolveOdiiBackgroundPresentation('onmaru-signature')).toMatchObject({
      warmthField: 0.68,
      thresholdShadow: 0.72,
      paperDepth: 0.58,
    });
  });

  it('keeps the production default separate from experimental renderers', () => {
    expect(resolveOdiiBackgroundScene('default', 'featured', '전체').variant).toBe('default');
    expect(resolveOdiiBackgroundScene('onmaru-signature', 'closing', '한옥')).toMatchObject({
      stage: 'closing',
      category: 'hanok',
      motif: 'seal',
    });
  });
});
