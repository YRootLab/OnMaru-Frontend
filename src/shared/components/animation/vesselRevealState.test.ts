import { describe, expect, it } from 'vitest';
import { getVesselRevealStage } from './vesselRevealState';

describe('getVesselRevealStage', () => {
  it('marks sections above the initial reveal boundary as already shown', () => {
    expect(getVesselRevealStage({ hasBeenSeen: false, isIntersecting: false, top: -120, revealBoundary: 720 })).toBe('bloomed');
  });

  it('keeps a below-fold section folded until it enters the reveal boundary', () => {
    expect(getVesselRevealStage({ hasBeenSeen: false, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('vessel');
  });

  it('never folds a section that has already been shown', () => {
    expect(getVesselRevealStage({ hasBeenSeen: true, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('bloomed');
  });
});
