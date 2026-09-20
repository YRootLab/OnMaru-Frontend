import { describe, expect, it } from 'vitest';
import { resolveVesselRevealState } from './vesselRevealState';

const baseInput = {
  currentStage: 'vessel' as const,
  isInitialObservation: false,
  isReloadProtected: false,
  isIntersecting: false,
  isViewportIntersecting: false,
  top: 900,
  bottom: 1100,
  revealBoundary: 720,
  viewportBottom: 900,
};

describe('resolveVesselRevealState', () => {
  it('starts a section already visible on reload in its final state without animation', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isInitialObservation: true,
      isViewportIntersecting: true,
      top: 800,
      bottom: 1000,
    })).toEqual({ stage: 'bloomed', isReloadProtected: true });
  });

  it('keeps an unseen section below the viewport folded on reload', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isInitialObservation: true,
      top: 1000,
      bottom: 1200,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('reveals a new section when it enters the lower viewport boundary', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isIntersecting: true,
      isViewportIntersecting: true,
      top: 700,
      bottom: 900,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false });
  });

  it('folds a bloomed section when it leaves the viewport while scrolling upward', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      top: -220,
      bottom: -20,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('folds a bloomed section when it leaves the viewport below', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      top: 920,
      bottom: 1120,
    })).toEqual({ stage: 'vessel', isReloadProtected: false });
  });

  it('reveals the section again when it re-enters after folding', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'vessel',
      isIntersecting: true,
      isViewportIntersecting: true,
      top: 700,
      bottom: 900,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false });
  });

  it('removes reload protection after the initial visible section is observed', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      isReloadProtected: true,
      isViewportIntersecting: true,
      top: 800,
      bottom: 1000,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false });
  });
});
