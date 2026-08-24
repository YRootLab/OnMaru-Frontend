import type { OdiiBackgroundStage } from './odiiBackground.types';

export interface OdiiStageObservation {
  stage: OdiiBackgroundStage;
  isIntersecting: boolean;
  intersectionRatio: number;
  top: number;
}

export interface OdiiMotionStateOptions {
  isReducedMotion: boolean;
  isDocumentVisible: boolean;
  isPlaying: boolean;
  hasAnimationSupport?: boolean;
}

export interface OdiiMotionState {
  drift: boolean;
  parallax: boolean;
  breathing: boolean;
  animatedTear: boolean;
}

export function canObserveOdiiBackground(observer: unknown): boolean {
  return typeof observer === 'function';
}

export function selectDominantOdiiStage(
  observations: readonly OdiiStageObservation[],
  currentStage: OdiiBackgroundStage,
  windowFocusTop = 0,
): OdiiBackgroundStage {
  const visible = observations
    .filter((observation) => observation.isIntersecting)
    .sort((left, right) => {
      const ratioDifference = right.intersectionRatio - left.intersectionRatio;
      if (ratioDifference !== 0) return ratioDifference;
      return Math.abs(left.top - windowFocusTop) - Math.abs(right.top - windowFocusTop);
    });

  return visible[0]?.stage ?? currentStage;
}

export function normalizeOdiiSectionProgress(
  top: number,
  height: number,
  viewportHeight: number,
): number {
  const journey = Math.max(1, height + viewportHeight);
  return Math.min(1, Math.max(0, (viewportHeight - top) / journey));
}

export function resolveOdiiMotionState({
  isReducedMotion,
  isDocumentVisible,
  isPlaying,
  hasAnimationSupport = true,
}: OdiiMotionStateOptions): OdiiMotionState {
  const ambientMotionAllowed = hasAnimationSupport && !isReducedMotion && isDocumentVisible;

  return {
    drift: ambientMotionAllowed,
    parallax: ambientMotionAllowed,
    breathing: ambientMotionAllowed && isPlaying,
    animatedTear: ambientMotionAllowed,
  };
}
