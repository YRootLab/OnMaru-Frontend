import { describe, expect, it } from 'vitest';
import { getVesselRevealStage } from './vesselRevealState';

describe('getVesselRevealStage', () => {
  it('keeps a section above the initial reveal boundary bloomed after scrolling back to it', () => {
    expect(getVesselRevealStage({ lockBloomed: true, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('bloomed');
  });

  it('keeps a below-fold section folded until it enters the reveal boundary', () => {
    expect(getVesselRevealStage({ lockBloomed: false, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('vessel');
  });

  it('allows a section initially below the fold to collapse after it leaves downward', () => {
    expect(getVesselRevealStage({ lockBloomed: false, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('vessel');
  });
});
