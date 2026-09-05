export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  hasBeenSeen: boolean;
  isIntersecting: boolean;
  top: number;
  revealBoundary: number;
}

export function getVesselRevealStage({
  hasBeenSeen,
  isIntersecting,
  top,
  revealBoundary,
}: VesselRevealStateInput): VesselRevealStage {
  if (hasBeenSeen || isIntersecting || top < revealBoundary) return 'bloomed';
  return 'vessel';
}
