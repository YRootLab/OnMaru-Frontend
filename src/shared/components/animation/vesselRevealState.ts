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
    // 새로고침 당시 viewport에 이미 보이는 섹션은 reveal boundary 아래에 있더라도
    // 최종 상태로 시작해 새로고침 직후 scale-in이 다시 재생되지 않게 한다.
    const shouldProtect = top < viewportBottom;
    return {
      stage: shouldProtect ? 'bloomed' : 'vessel',
      isReloadProtected: shouldProtect,
      shouldAnimate: false,
    };
  }

  // 새로고침 당시 보였던 섹션은 이후 위로 스크롤해도 최종 상태를 유지한다.
  if (isReloadProtected) {
    return { stage: 'bloomed', isReloadProtected: true, shouldAnimate: false };
  }

  // 아래로 내려가며 reveal boundary에 새로 들어온 섹션은 scale-up한다.
  if (isIntersecting) {
    return { stage: 'bloomed', isReloadProtected: false, shouldAnimate: true };
  }

  // 위로 올라가며 섹션이 boundary 아래로 밀려나면 scale-down한다.
  if (top >= revealBoundary) {
    return { stage: 'vessel', isReloadProtected: false, shouldAnimate: true };
  }

  // 이미 bloomed된 상단 섹션은 위로 스크롤할 때 접히지 않고 그대로 유지한다.
  return { stage: currentStage, isReloadProtected: false, shouldAnimate: false };
}
