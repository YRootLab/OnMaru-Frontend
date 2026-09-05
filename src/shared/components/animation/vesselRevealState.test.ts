import { describe, expect, it } from 'vitest';
import { getVesselRevealStage } from './vesselRevealState';

describe('getVesselRevealStage', () => {
  it('keeps a section above the initial reveal boundary bloomed after scrolling back to it', () => {
    expect(getVesselRevealStage({ hasRevealed: true, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('bloomed');
  });

  it('keeps a below-fold section folded until it enters the reveal boundary', () => {
    expect(getVesselRevealStage({ hasRevealed: false, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('vessel');
  });

  it('blooms a section when it enters the reveal boundary', () => {
    expect(getVesselRevealStage({ hasRevealed: false, isIntersecting: true, top: 700, revealBoundary: 720 })).toBe('bloomed');
  });
});
