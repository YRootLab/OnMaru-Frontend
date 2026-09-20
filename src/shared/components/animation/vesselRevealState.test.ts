import { describe, expect, it } from 'vitest';
import { resolveVesselRevealState } from './vesselRevealState';

const baseInput = {
  currentStage: 'vessel' as const,
  isInitialObservation: false,
  isReloadProtected: false,
  isIntersecting: false,
  isViewportIntersecting: false,
  scrollDirection: 'down' as const,
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
    })).toEqual({ stage: 'bloomed', isReloadProtected: true, shouldAnimate: false });
  });

  it('keeps an unseen section below the viewport folded on reload', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isInitialObservation: true,
      top: 1000,
      bottom: 1200,
    })).toEqual({ stage: 'vessel', isReloadProtected: false, shouldAnimate: false });
  });

  it('reveals a new section when it enters the lower viewport boundary', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      isIntersecting: true,
      isViewportIntersecting: true,
      top: 700,
      bottom: 900,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false, shouldAnimate: true });
  });

  it('folds a bloomed section when it leaves through the lower viewport while scrolling upward', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      scrollDirection: 'up',
      isViewportIntersecting: false,
      top: 920,
      bottom: 1120,
    })).toEqual({ stage: 'vessel', isReloadProtected: false, shouldAnimate: true });
  });

  it('keeps a section above the viewport final when it becomes visible while scrolling upward', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'vessel',
      scrollDirection: 'up',
      isViewportIntersecting: true,
      top: 40,
      bottom: 240,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false, shouldAnimate: false });
  });

  it('folds a bloomed section immediately when it leaves upward through the top', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'bloomed',
      scrollDirection: 'up',
      isViewportIntersecting: false,
      top: -220,
      bottom: -20,
    })).toEqual({ stage: 'vessel', isReloadProtected: false, shouldAnimate: false });
  });

  it('reveals the section again when it re-enters from below while scrolling downward', () => {
    expect(resolveVesselRevealState({
      ...baseInput,
      currentStage: 'vessel',
      isIntersecting: true,
      isViewportIntersecting: true,
      top: 700,
      bottom: 900,
    })).toEqual({ stage: 'bloomed', isReloadProtected: false, shouldAnimate: true });
  });
});
