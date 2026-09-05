export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  hasRevealed: boolean;
  isIntersecting: boolean;
  top: number;
  revealBoundary: number;
}

export function getVesselRevealStage({
  hasRevealed,
  isIntersecting,
  top,
  revealBoundary,
}: VesselRevealStateInput): VesselRevealStage | null {
  if (hasRevealed || isIntersecting) return 'bloomed';
  if (top >= revealBoundary) return 'vessel';
  return null;
}
