import { describe, expect, it } from 'vitest';
import {
  formatPipelineDuration,
  getAdminPipelineErrorPresentation,
  getPipelineStatusPresentation,
} from './adminPipelinePresentation';

describe('admin pipeline presentation', () => {
  it('formats nullable and elapsed durations without inventing progress', () => {
    expect(formatPipelineDuration(null)).toBe('집계 중');
    expect(formatPipelineDuration(59)).toBe('59초');
    expect(formatPipelineDuration(332)).toBe('5분 32초');
    expect(formatPipelineDuration(3725)).toBe('1시간 2분');
  });

  it.each([
    ['MISSING', '실행 이력 없음'], ['IDLE', '대기'], ['RUNNING', '실행 중'],
    ['SUCCEEDED', '성공'], ['FAILED', '실패'], ['CANCELLED', '취소됨'],
    ['QUEUED', '대기'], ['ABANDONED', '중단·건너뜀'],
  ] as const)('maps %s to %s', (status, label) => {
    expect(getPipelineStatusPresentation(status).label).toBe(label);
  });

  it('maps backend codes and appends the request id for support', () => {
    expect(getAdminPipelineErrorPresentation({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'INTERNAL_ERROR',
      requestId: 'request-668',
      details: {},
      classification: 'SERVER_ERROR',
    })).toEqual({
      title: '파이프라인 상태를 불러오지 못했어요.',
      description: '잠시 후 다시 시도해 주세요. 문의 코드: request-668',
    });
  });
});
