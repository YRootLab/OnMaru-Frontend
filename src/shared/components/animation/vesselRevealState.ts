export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  currentStage: VesselRevealStage;
  isInitialObservation: boolean;
  isReloadProtected: boolean;
  isIntersecting: boolean;
  top: number;
  revealBoundary: number;
  viewportBottom: number;
}

interface VesselRevealStateResult {
  stage: VesselRevealStage;
  isReloadProtected: boolean;
  shouldAnimate: boolean;
}

export function resolveVesselRevealState({
  currentStage,
  isInitialObservation,
  isReloadProtected,
  isIntersecting,
  top,
  revealBoundary,
  viewportBottom,
}: VesselRevealStateInput): VesselRevealStateResult {
  if (isInitialObservation) {


    const shouldProtect = top < viewportBottom;
    return {
      stage: shouldProtect ? 'bloomed' : 'vessel',
      isReloadProtected: shouldProtect,
      shouldAnimate: false,
    };
  }


  if (isReloadProtected) {
    return { stage: 'bloomed', isReloadProtected: true, shouldAnimate: false };
  }


  if (isIntersecting) {
    return { stage: 'bloomed', isReloadProtected: false, shouldAnimate: true };
  }


  if (top >= revealBoundary) {
    return { stage: 'vessel', isReloadProtected: false, shouldAnimate: true };
  }


  return { stage: currentStage, isReloadProtected: false, shouldAnimate: false };
}
