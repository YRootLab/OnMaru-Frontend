export type VesselRevealStage = 'vessel' | 'bloomed';

interface VesselRevealStateInput {
  currentStage: VesselRevealStage;
  isInitialObservation: boolean;
  isReloadProtected: boolean;
  isIntersecting: boolean;
  isViewportIntersecting: boolean;
  top: number;
  bottom: number;
  revealBoundary: number;
  viewportBottom: number;
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
  isViewportIntersecting,
  top,
  bottom,
  revealBoundary,
  viewportBottom,
}: VesselRevealStateInput): VesselRevealStateResult {
  if (isInitialObservation) {
    // 새로고침 당시 viewport에 보이는 섹션은 reveal boundary 아래에 있더라도
    // 최종 상태로 시작해 새로고침 직후 scale-in이 다시 재생되지 않게 한다.
    const shouldProtect = bottom > 0 && top < viewportBottom;
    return {
      stage: shouldProtect ? 'bloomed' : 'vessel',
      isReloadProtected: shouldProtect,
    };
  }

  // 새로고침 보호는 첫 관찰에서만 scale-in을 막는다. 이후에는 viewport를 벗어나면
  // 다시 vessel로 돌아가 다음 진입에서 자연스럽게 scale-up되도록 보호를 해제한다.
  if (isReloadProtected) {
    return isViewportIntersecting
      ? { stage: 'bloomed', isReloadProtected: false }
      : { stage: 'vessel', isReloadProtected: false };
  }

  // viewport 밖으로 나가면 위/아래 방향과 관계없이 접힌 상태로 돌아간다.
  if (!isViewportIntersecting) {
    return { stage: 'vessel', isReloadProtected: false };
  }

  // reveal observer는 하단 경계 진입을 선제적으로 감지한다.
  if (isIntersecting && top < revealBoundary) {
    return { stage: 'bloomed', isReloadProtected: false };
  }

  return { stage: currentStage, isReloadProtected: false };
}
