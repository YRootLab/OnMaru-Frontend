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
    // 뒤이어 발생하는 스크롤 트리거와 동일한 경계(revealBoundary)로 판정해야, 화면 하단
    // 언저리에 살짝 걸친 섹션이 "이미 봤다"로 영구 고정되어 진입 애니메이션을 잃지 않는다.
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
