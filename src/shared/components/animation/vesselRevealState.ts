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
    // 최종 상태로 고정해, 새로고침 직후 scale-in이 다시 재생되지 않게 한다.
    const shouldProtect = top < viewportBottom;
    return {
      stage: shouldProtect ? 'bloomed' : 'vessel',
      isReloadProtected: shouldProtect,
    };
  }

  // 1. 이미 새로고침으로 보호되었거나, 이번 세션에서 한 번이라도 리빌(bloomed)된 섹션은
  //    위로 스크롤하거나 화면 밖으로 벗어나도 영구적으로 bloomed(최종 상태)를 유지하며 접히지 않는다.
  if (isReloadProtected || currentStage === 'bloomed') {
    return { stage: 'bloomed', isReloadProtected: true };
  }

  // 2. 아직 보지 않은 하단 섹션이 사용자의 하향 스크롤을 통해 뷰포트 하단 33% 경계로 진입할 때 1회성으로 bloomed 전환
  if (isIntersecting || top < revealBoundary) {
    return { stage: 'bloomed', isReloadProtected: true };
  }

  // 3. 아직 화면에 도달하지 않은 하단 섹션은 vessel(진입 대기) 유지
  return { stage: 'vessel', isReloadProtected: false };
}
