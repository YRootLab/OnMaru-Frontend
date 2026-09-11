import type { SorimaruBackgroundStage } from './sorimaruBackground.types';

export interface SorimaruStageObservation {
  stage: SorimaruBackgroundStage;
  isIntersecting: boolean;
  intersectionRatio: number;
  top: number;
}

export interface SorimaruMotionStateOptions {
  isReducedMotion: boolean;
  isDocumentVisible: boolean;
  isPlaying: boolean;
  hasAnimationSupport?: boolean;
}

export interface SorimaruMotionState {
  drift: boolean;
  parallax: boolean;
  breathing: boolean;
  animatedTear: boolean;
}

export function canObserveSorimaruBackground(observer: unknown): boolean {
  return typeof observer === 'function';
}

export function selectDominantSorimaruStage(
  observations: readonly SorimaruStageObservation[],
  currentStage: SorimaruBackgroundStage,
  windowFocusTop = 0,
): SorimaruBackgroundStage {
  const visible = observations
    .filter((observation) => observation.isIntersecting)
    .sort((left, right) => {
      const ratioDifference = right.intersectionRatio - left.intersectionRatio;
      if (ratioDifference !== 0) return ratioDifference;
      return Math.abs(left.top - windowFocusTop) - Math.abs(right.top - windowFocusTop);
    });

  return visible[0]?.stage ?? currentStage;
}

export function normalizeSorimaruSectionProgress(
  top: number,
  height: number,
  viewportHeight: number,
): number {
  const journey = Math.max(1, height + viewportHeight);
  return Math.min(1, Math.max(0, (viewportHeight - top) / journey));
}

export function resolveSorimaruMotionState({
  isReducedMotion,
  isDocumentVisible,
  isPlaying,
  hasAnimationSupport = true,
}: SorimaruMotionStateOptions): SorimaruMotionState {
  const ambientMotionAllowed = hasAnimationSupport && !isReducedMotion && isDocumentVisible;

  return {
    drift: ambientMotionAllowed,
    parallax: ambientMotionAllowed,
    breathing: ambientMotionAllowed && isPlaying,
    animatedTear: ambientMotionAllowed,
  };
}
