import { describe, expect, it } from 'vitest';
import { resolveVesselRevealState } from './vesselRevealState';

describe('resolveVesselRevealState', () => {
  it('protects a section already at or above the reveal boundary during initial measurement (reload/initial load)', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: 200,
      revealBoundary: 720,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('keeps an unseen section below the reveal boundary in vessel stage during initial measurement', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: 900,
      revealBoundary: 720,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('blooms a section with one-shot protection when it enters the reveal boundary during downward scroll', () => {
    expect(resolveVesselRevealState({
      currentStage: 'vessel',
      isInitialObservation: false,
      isReloadProtected: false,
      isIntersecting: true,
      top: 700,
      revealBoundary: 720,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('keeps a revealed section bloomed when scrolling back upward, without folding or replaying', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: true,
      isIntersecting: false,
      top: 760,
      revealBoundary: 720,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('keeps a section bloomed when it passes above the top of the viewport', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: true,
      isIntersecting: false,
      top: -500,
      revealBoundary: 720,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('does not fold back to vessel once bloomed even if isReloadProtected was initially false', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: false,
      isIntersecting: false,
      top: 800,
      revealBoundary: 720,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });
});
