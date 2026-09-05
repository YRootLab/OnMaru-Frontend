export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  lockBloomed: boolean;
  isIntersecting: boolean;
  top: number;
  revealBoundary: number;
}

export function getVesselRevealStage({
  lockBloomed,
  isIntersecting,
  top,
  revealBoundary,
}: VesselRevealStateInput): VesselRevealStage | null {
  if (lockBloomed || isIntersecting) return 'bloomed';
  if (top >= revealBoundary) return 'vessel';
  return null;
}
