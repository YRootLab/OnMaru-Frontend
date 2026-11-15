import { describe, expect, it } from 'vitest';
import { getJourneyStageMessage } from './journeyConversation';

describe('getJourneyStageMessage', () => {
  it('uses the public v1.3 copy for evidence selection and generation', () => {
    expect(getJourneyStageMessage('SELECTING_EVIDENCE')).toBe('관련 정보를 다루는 영역을 선택하고 있어요.');
    expect(getJourneyStageMessage('GENERATING')).toBe('찾은 정보를 바탕으로 여행을 정리하고 있어요.');
  });

  it('keeps an unsupported stage in a safe generic progress state', () => {
    expect(getJourneyStageMessage('FUTURE_STAGE')).toBe('여행을 준비하고 있어요.');
  });
});
