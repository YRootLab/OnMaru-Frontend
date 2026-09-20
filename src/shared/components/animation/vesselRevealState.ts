export type VesselRevealStage = 'vessel' | 'bloomed';
export type VesselRevealScrollDirection = 'up' | 'down';

interface VesselRevealStateInput {
  currentStage: VesselRevealStage;
  isInitialObservation: boolean;
  isReloadProtected: boolean;
  isIntersecting: boolean;
  isViewportIntersecting: boolean;
  scrollDirection: VesselRevealScrollDirection;
  top: number;
  bottom: number;
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
  isViewportIntersecting,
  scrollDirection,
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
      shouldAnimate: false,
    };
  }

  // 새로고침 보호는 첫 관찰에서만 scale-in을 막는다. 이후에는 viewport를 벗어나면
  // 다시 vessel로 돌아가 다음 진입에서 자연스럽게 scale-up되도록 보호를 해제한다.
  if (isReloadProtected) {
    return isViewportIntersecting
      ? { stage: 'bloomed', isReloadProtected: false, shouldAnimate: false }
      : { stage: 'vessel', isReloadProtected: false, shouldAnimate: false };
  }

  if (currentStage === 'vessel') {
    if (!isViewportIntersecting) {
      return { stage: 'vessel', isReloadProtected: false, shouldAnimate: false };
    }

    // 상향 스크롤로 위에서 새롭게 들어오는 섹션은 최종 상태로 즉시 표시한다.
    if (scrollDirection === 'up') {
      return { stage: 'bloomed', isReloadProtected: false, shouldAnimate: false };
    }

    // 하향 스크롤로 하단 reveal 경계에 들어오는 섹션만 scale-up한다.
    if (isIntersecting && top < revealBoundary) {
      return { stage: 'bloomed', isReloadProtected: false, shouldAnimate: true };
    }

    return { stage: 'vessel', isReloadProtected: false, shouldAnimate: false };
  }

  if (isViewportIntersecting) {
    return { stage: 'bloomed', isReloadProtected: false, shouldAnimate: false };
  }

  // 상향 스크롤로 섹션이 viewport 아래로 밀려나면 scale-down하며 사라진다.
  const leavesThroughBottom = scrollDirection === 'up' && top >= viewportBottom;
  return {
    stage: 'vessel',
    isReloadProtected: false,
    shouldAnimate: leavesThroughBottom,
  };
}
