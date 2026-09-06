export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  currentStage: VesselRevealStage;
  isInitialObservation: boolean;
  isReloadProtected: boolean;
  isIntersecting: boolean;
  top: number;
  revealBoundary: number;
}

interface VesselRevealStateResult {
  stage: VesselRevealStage;
  isReloadProtected: boolean;
}

export function resolveVesselRevealState({
  currentStage,
  isInitialObservation,
  isReloadProtected,
  isIntersecting,
  top,
  revealBoundary,
}: VesselRevealStateInput): VesselRevealStateResult {
  if (isInitialObservation) {
    const shouldProtect = top < revealBoundary;
    return {
      stage: shouldProtect ? 'bloomed' : 'vessel',
      isReloadProtected: shouldProtect,
    };
  }

  if (isReloadProtected) return { stage: 'bloomed', isReloadProtected: true };
  if (isIntersecting) return { stage: 'bloomed', isReloadProtected: false };
  if (top >= revealBoundary) return { stage: 'vessel', isReloadProtected: false };

  return { stage: currentStage, isReloadProtected: false };
}
