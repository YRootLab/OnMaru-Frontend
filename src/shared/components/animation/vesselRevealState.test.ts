import { describe, expect, it } from 'vitest';
import { resolveVesselRevealState } from './vesselRevealState';

const baseInput = {
  currentStage: 'vessel' as const,
  isInitialObservation: false,
  isReloadProtected: false,
  isIntersecting: false,
  top: 900,
  revealBoundary: 720,
  viewportBottom: 900,
};

describe('resolveVesselRevealState', () => {
  it('keeps a section already visible on reload in its final state', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isInitialObservation: true,
      top: 800,
    })).toEqual({
      stage: 'bloomed',
      isReloadProtected: true,
      shouldAnimate: false,
    });
  });

  it('keeps an unseen section below the viewport folded on reload', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isInitialObservation: true,
      top: 1000,
    })).toEqual({
      stage: 'vessel',
      isReloadProtected: false,
      shouldAnimate: false,
    });
  });

  it('reveals a new section entering the reveal boundary', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isIntersecting: true,
      top: 700,
    })).toEqual({
      stage: 'bloomed',
      isReloadProtected: false,
      shouldAnimate: true,
    });
  });

  it('folds a revealed section leaving through the lower reveal boundary', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      top: 760,
    })).toEqual({
      stage: 'vessel',
      isReloadProtected: false,
      shouldAnimate: true,
    });
  });

  it('keeps an already revealed section final when it passes above the boundary', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      top: -200,
    })).toEqual({
      stage: 'bloomed',
      isReloadProtected: false,
      shouldAnimate: false,
    });
  });

  it('does not animate a reload-protected section during observer callbacks', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      isReloadProtected: true,
      top: 760,
    })).toEqual({
      stage: 'bloomed',
      isReloadProtected: true,
      shouldAnimate: false,
    });
  });
});
