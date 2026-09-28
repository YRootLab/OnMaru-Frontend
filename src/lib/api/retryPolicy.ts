import { ApiErrorClassification, OnmaruApiError } from './errors';

export type RetryStrategy = {
  maxRetries: number;
  maxTotalDurationMs: number;
  intervalsMs: number[];
  getDelayMs: (attempt: number, error?: OnmaruApiError) => number;
};

export const API_RETRY_POLICIES: Record<ApiErrorClassification, RetryStrategy> = {
  // Render 절전 복귀 중: 3초, 5초, 10초, 15초, 20초 간격으로 재시도. 최대 60~90초 대기
  SERVER_WAKING: {
    maxRetries: 12,
    maxTotalDurationMs: 90_000,
    intervalsMs: [3_000, 5_000, 10_000, 15_000, 20_000],
    getDelayMs: (attempt: number) => {
      const intervals = [3_000, 5_000, 10_000, 15_000, 20_000];
      return intervals[Math.min(attempt - 1, intervals.length - 1)] ?? 20_000;
    },
  },

  // 백엔드 503 (SERVICE_UNAVAILABLE): 자동 재시도 1~2회 (최대 2회)
  SERVICE_UNAVAILABLE: {
    maxRetries: 2,
    maxTotalDurationMs: 10_000,
    intervalsMs: [1_000, 2_000],
    getDelayMs: (attempt: number) => {
      const intervals = [1_000, 2_000];
      return intervals[Math.min(attempt - 1, intervals.length - 1)] ?? 2_000;
    },
  },

  // 일반 서버 오류 (HTTP 500): 자동 재시도 1회
  SERVER_ERROR: {
    maxRetries: 1,
    maxTotalDurationMs: 5_000,
    intervalsMs: [1_000],
    getDelayMs: () => 1_000,
  },

  // Rate limited (429): 자동 재시도 1회
  RATE_LIMITED: {
    maxRetries: 1,
    maxTotalDurationMs: 5_000,
    intervalsMs: [2_000],
    getDelayMs: (_attempt, error) => {
      if (error?.details?.retryAfterMs && typeof error.details.retryAfterMs === 'number') {
        return error.details.retryAfterMs;
      }
      if (error?.details?.retryAfterSeconds && typeof error.details.retryAfterSeconds === 'number') {
        return error.details.retryAfterSeconds * 1_000;
      }
      return 2_000;
    },
  },

  CLIENT_ERROR: {
    maxRetries: 0,
    maxTotalDurationMs: 0,
    intervalsMs: [],
    getDelayMs: () => 0,
  },

  UNKNOWN_ERROR: {
    maxRetries: 0,
    maxTotalDurationMs: 0,
    intervalsMs: [],
    getDelayMs: () => 0,
  },
};

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };

    signal?.addEventListener('abort', onAbort);
  });
}
