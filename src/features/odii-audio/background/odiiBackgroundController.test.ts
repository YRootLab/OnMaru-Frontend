import { describe, expect, it } from 'vitest';
import {
  normalizeOdiiSectionProgress,
  resolveOdiiMotionState,
  selectDominantOdiiStage,
} from './odiiBackgroundController';

describe('selectDominantOdiiStage', () => {
  it('selects the visible stage with the highest intersection ratio', () => {
    expect(selectDominantOdiiStage([
      { stage: 'themes', isIntersecting: true, intersectionRatio: 0.28, top: -120 },
      { stage: 'nearby', isIntersecting: true, intersectionRatio: 0.72, top: 260 },
    ], 'themes')).toBe('nearby');
  });

  it('breaks equal-ratio ties by proximity to the viewport focus line', () => {
    expect(selectDominantOdiiStage([
      { stage: 'related', isIntersecting: true, intersectionRatio: 0.5, top: -420 },
      { stage: 'archive', isIntersecting: true, intersectionRatio: 0.5, top: 80 },
    ], 'related')).toBe('archive');
  });

  it('keeps the current stage when no marker is visible', () => {
    expect(selectDominantOdiiStage([], 'collection')).toBe('collection');
  });
});

describe('normalizeOdiiSectionProgress', () => {
  it('clamps a marker journey through the viewport to zero and one', () => {
    expect(normalizeOdiiSectionProgress(900, 600, 1000)).toBe(0.0625);
    expect(normalizeOdiiSectionProgress(1200, 600, 1000)).toBe(0);
    expect(normalizeOdiiSectionProgress(-700, 600, 1000)).toBe(1);
  });
});

describe('resolveOdiiMotionState', () => {
  it('turns every ambient animation off for reduced motion', () => {
    expect(resolveOdiiMotionState({
      isReducedMotion: true,
      isDocumentVisible: true,
      isPlaying: true,
    })).toEqual({
      drift: false,
      parallax: false,
      breathing: false,
      animatedTear: false,
    });
  });

  it('allows playback breathing only while visible and playing', () => {
    expect(resolveOdiiMotionState({
      isReducedMotion: false,
      isDocumentVisible: true,
      isPlaying: true,
    })).toEqual({
      drift: true,
      parallax: true,
      breathing: true,
      animatedTear: true,
    });

    expect(resolveOdiiMotionState({
      isReducedMotion: false,
      isDocumentVisible: false,
      isPlaying: true,
    }).breathing).toBe(false);
  });
});
