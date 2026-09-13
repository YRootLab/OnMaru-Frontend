import { describe, expect, it } from 'vitest';
import {
  canObserveSorimaruBackground,
  normalizeSorimaruSectionProgress,
  resolveSorimaruMotionState,
  selectDominantSorimaruStage,
} from './sorimaruBackgroundController';

describe('selectDominantSorimaruStage', () => {
  it('selects the visible stage with the highest intersection ratio', () => {
    expect(selectDominantSorimaruStage([
      { stage: 'themes', isIntersecting: true, intersectionRatio: 0.28, top: -120 },
      { stage: 'nearby', isIntersecting: true, intersectionRatio: 0.72, top: 260 },
    ], 'themes')).toBe('nearby');
  });

  it('breaks equal-ratio ties by proximity to the viewport focus line', () => {
    expect(selectDominantSorimaruStage([
      { stage: 'related', isIntersecting: true, intersectionRatio: 0.5, top: -420 },
      { stage: 'archive', isIntersecting: true, intersectionRatio: 0.5, top: 80 },
    ], 'related')).toBe('archive');
  });

  it('keeps the current stage when no marker is visible', () => {
    expect(selectDominantSorimaruStage([], 'collection')).toBe('collection');
  });
});

describe('normalizeSorimaruSectionProgress', () => {
  it('clamps a marker journey through the viewport to zero and one', () => {
    expect(normalizeSorimaruSectionProgress(900, 600, 1000)).toBe(0.0625);
    expect(normalizeSorimaruSectionProgress(1200, 600, 1000)).toBe(0);
    expect(normalizeSorimaruSectionProgress(-700, 600, 1000)).toBe(1);
  });
});

describe('canObserveSorimaruBackground', () => {
  it('keeps the background static when IntersectionObserver is unavailable', () => {
    expect(canObserveSorimaruBackground(undefined)).toBe(false);
    expect(canObserveSorimaruBackground(class FakeIntersectionObserver {})).toBe(true);
  });
});

describe('resolveSorimaruMotionState', () => {
  it('turns every ambient animation off for reduced motion', () => {
    expect(resolveSorimaruMotionState({
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
    expect(resolveSorimaruMotionState({
      isReducedMotion: false,
      isDocumentVisible: true,
      isPlaying: true,
    })).toEqual({
      drift: true,
      parallax: true,
      breathing: true,
      animatedTear: true,
    });

    expect(resolveSorimaruMotionState({
      isReducedMotion: false,
      isDocumentVisible: false,
      isPlaying: true,
    }).breathing).toBe(false);
  });

  it('returns a complete static fallback without animation support', () => {
    expect(resolveSorimaruMotionState({
      isReducedMotion: false,
      isDocumentVisible: true,
      isPlaying: true,
      hasAnimationSupport: false,
    })).toEqual({
      drift: false,
      parallax: false,
      breathing: false,
      animatedTear: false,
    });
  });
});
