import { describe, expect, it } from 'vitest';
import {
  getSorimaruTearBoundaries,
  SORIMARU_BACKGROUND_PALETTE,
  SORIMARU_BACKGROUND_STAGES,
  resolveSorimaruBackgroundCategory,
  resolveSorimaruBackgroundPresentation,
  resolveSorimaruBackgroundScene,
} from './sorimaruBackgroundScenes';

describe('Sorimaru background scene model', () => {
  it('uses a true-white neutral palette across every experimental background', () => {
    expect(SORIMARU_BACKGROUND_PALETTE).toEqual({
      canvas: '#ffffff',
      paper: '#ffffff',
      lightRgb: '255, 255, 255',
      fiberRgb: '112, 112, 112',
      shadowRgb: '70, 70, 70',
      accentRgb: '145, 145, 145',
    });
  });

  it('maps only approved Sorimaru themes to restrained category modifiers', () => {
    expect(resolveSorimaruBackgroundCategory('한옥')).toBe('hanok');
    expect(resolveSorimaruBackgroundCategory('시장')).toBe('market');
    expect(resolveSorimaruBackgroundCategory('마을')).toBe('village');
    expect(resolveSorimaruBackgroundCategory('궁')).toBe('palace');
    expect(resolveSorimaruBackgroundCategory('길')).toBe('nature');
    expect(resolveSorimaruBackgroundCategory('서울')).toBe('default');
  });

  it('limits strong tear boundaries to the approved variants and stages', () => {
    expect(getSorimaruTearBoundaries('warmth-grain')).toEqual([]);
    expect(getSorimaruTearBoundaries('changho-breeze')).toEqual([]);
    expect(getSorimaruTearBoundaries('hanji-journey')).toEqual(['nearby', 'archive']);
    expect(getSorimaruTearBoundaries('onmaru-signature')).toEqual(['archive']);
  });

  it('resolves a complete scene for every stable Sorimaru stage', () => {
    expect(SORIMARU_BACKGROUND_STAGES).toEqual([
      'featured',
      'themes',
      'nearby',
      'related',
      'archive',
      'collection',
      'closing',
    ]);

    expect(resolveSorimaruBackgroundScene('onmaru-signature', 'nearby', '시장')).toMatchObject({
      variant: 'onmaru-signature',
      stage: 'nearby',
      category: 'market',
      motif: 'leaf',
    });
    expect(resolveSorimaruBackgroundScene('warmth-grain', 'archive', '전체').motionLevel).toBe('quiet');
  });

  it('gives each comparison route a different restrained material emphasis', () => {
    expect(resolveSorimaruBackgroundPresentation('warmth-grain')).toMatchObject({
      warmthField: 1,
      thresholdShadow: 0.18,
      paperDepth: 0.22,
    });
    expect(resolveSorimaruBackgroundPresentation('changho-breeze')).toMatchObject({
      warmthField: 0.28,
      thresholdShadow: 1,
      paperDepth: 0.18,
    });
    expect(resolveSorimaruBackgroundPresentation('hanji-journey')).toMatchObject({
      warmthField: 0.2,
      thresholdShadow: 0.22,
      paperDepth: 1,
    });
    expect(resolveSorimaruBackgroundPresentation('onmaru-signature')).toMatchObject({
      warmthField: 0.68,
      thresholdShadow: 0.72,
      paperDepth: 0.58,
    });
  });

  it('keeps the production default separate from experimental renderers', () => {
    expect(resolveSorimaruBackgroundScene('default', 'featured', '전체').variant).toBe('default');
    expect(resolveSorimaruBackgroundScene('onmaru-signature', 'closing', '한옥')).toMatchObject({
      stage: 'closing',
      category: 'hanok',
      motif: 'seal',
    });
  });
});
