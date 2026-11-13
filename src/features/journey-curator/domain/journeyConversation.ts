const STAGE_MESSAGES: Record<string, string> = {
  INTERPRETING: '질문에서 여행 조건을 정리하고 있어요.',
  RETRIEVING: '조건에 맞는 장소와 정보를 찾고 있어요.',
  SELECTING_EVIDENCE: '관련 정보를 다루는 영역을 선택하고 있어요.',
  GENERATING: '찾은 정보를 바탕으로 여행을 정리하고 있어요.',
  VALIDATING: '장소 정보와 권장 사항을 확인하고 있어요.',
  PERSISTING: '여행 결과를 준비하고 있어요.',
};

export function getJourneyStageMessage(stage: string | null | undefined): string {
  return (stage && STAGE_MESSAGES[stage]) || '여행을 준비하고 있어요.';
}
