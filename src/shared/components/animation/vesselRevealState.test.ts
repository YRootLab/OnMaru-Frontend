import { describe, expect, it } from 'vitest';
import { resolveVesselRevealState } from './vesselRevealState';

describe('resolveVesselRevealState', () => {
  it('protects a section already above the reveal boundary during initial measurement', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: 200,
      revealBoundary: 720,
      viewportBottom: 960,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('protects a section already visible below the reveal boundary on reload', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: 760,
      revealBoundary: 720,
      viewportBottom: 800,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('folds an unseen section below the reveal boundary during initial measurement', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: true,
      isReloadProtected: false,
      isIntersecting: false,
      top: 900,
      revealBoundary: 720,
      viewportBottom: 800,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('blooms a section when it enters the reveal boundary', () => {
    expect(resolveVesselRevealState({
      currentStage: 'vessel',
      isInitialObservation: false,
      isReloadProtected: false,
      isIntersecting: true,
      top: 700,
      revealBoundary: 720,
      viewportBottom: 960,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false });
  });

  it('folds a revealed section when it leaves through the lower boundary', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: false,
      isIntersecting: false,
      top: 760,
      revealBoundary: 720,
      viewportBottom: 960,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('keeps the current stage when a section has passed above the viewport', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: false,
      isIntersecting: false,
      top: -500,
      revealBoundary: 720,
      viewportBottom: 960,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false });
  });

  it('keeps an initially visible section bloomed for the current mount', () => {
    expect(resolveVesselRevealState({
      currentStage: 'bloomed',
      isInitialObservation: false,
      isReloadProtected: true,
      isIntersecting: false,
      top: 760,
      revealBoundary: 720,
      viewportBottom: 960,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });
});
