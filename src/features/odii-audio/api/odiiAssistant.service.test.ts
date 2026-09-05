import { describe, expect, it } from 'vitest';
import { validateOdiiAssistantResponse } from './odiiAssistant.service';

describe('validateOdiiAssistantResponse', () => {
  it('rejects a generated answer that has no playable Odii story source', () => {
    expect(() => validateOdiiAssistantResponse({ answer: '경주 이야기를 추천합니다.', sources: [] })).toThrow('Odii 출처가 없는 응답');
  });

  it('preserves a cited Odii story in an answer payload', () => {
    expect(validateOdiiAssistantResponse({
      answer: '백제문화단지 입구 이야기부터 들어보세요.',
      sources: [{ stid: '123', title: '백제문화단지 - 입구', locationName: '충남 부여군', formattedDuration: '2분 02초' }],
    })).toEqual({
      answer: '백제문화단지 입구 이야기부터 들어보세요.',
      sources: [{ stid: '123', title: '백제문화단지 - 입구', locationName: '충남 부여군', formattedDuration: '2분 02초' }],
    });
  });
});
