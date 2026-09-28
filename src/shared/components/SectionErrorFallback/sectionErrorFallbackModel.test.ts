import { describe, expect, it } from 'vitest';
import { resolveSectionErrorState } from './sectionErrorFallbackModel';
import { normalizeApiError } from '@/lib/api/errors';

describe('sectionErrorFallbackModel', () => {
  it('resolves SERVER_WAKING state without allowing manual retry', () => {
    const error = normalizeApiError(503, undefined, { 'x-render-routing': 'hibernate-wake-error' });
    const state = resolveSectionErrorState(error);

    expect(state).toEqual({
      title: '서비스를 준비하고 있어요.',
      description: '서비스를 준비하고 있어요. 첫 요청은 최대 30초 정도 걸릴 수 있습니다.',
      requestId: null,
      classification: 'SERVER_WAKING',
      isWaking: true,
      canRetry: false,
    });
  });

  it('resolves SERVICE_UNAVAILABLE state allowing manual retry', () => {
    const error = normalizeApiError(503, { code: 'SERVICE_UNAVAILABLE', message: '서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.' });
    const state = resolveSectionErrorState(error);

    expect(state).toEqual({
      title: '서비스 연결이 원활하지 않아요.',
      description: '서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.',
      requestId: null,
      classification: 'SERVICE_UNAVAILABLE',
      isWaking: false,
      canRetry: true,
    });
  });

  it('resolves SERVER_ERROR with requestId', () => {
    const error = normalizeApiError(500, { code: 'SERVER_ERROR', requestId: 'req-err-777' });
    const state = resolveSectionErrorState(error);

    expect(state).toEqual({
      title: '데이터를 불러오는 중 문제가 발생했어요.',
      description: '데이터를 불러오는 중 문제가 발생했어요.',
      requestId: 'req-err-777',
      classification: 'SERVER_ERROR',
      isWaking: false,
      canRetry: true,
    });
  });

  it('allows overriding title, description, and requestId', () => {
    const state = resolveSectionErrorState(
      new Error('Custom network error'),
      '커스텀 제목',
      '커스텀 설명',
      'req-custom-123'
    );

    expect(state).toEqual({
      title: '커스텀 제목',
      description: '커스텀 설명',
      requestId: 'req-custom-123',
      classification: 'UNKNOWN_ERROR',
      isWaking: false,
      canRetry: true,
    });
  });
});
