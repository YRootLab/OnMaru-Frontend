import { describe, expect, it, vi } from 'vitest';
import { normalizeApiError } from './errors';
import { shouldLoadNextPage } from './cursor';
import { createCsrfTokenProvider } from './csrf';
import { apiRequest, resetApiClientForTests } from './client';

describe('api contract foundation', () => {
  it('normalizes backend error bodies by code and request id', () => {
    const error = normalizeApiError(409, {
      schemaVersion: '1.2',
      code: 'ACTIVE_RUN',
      message: 'run is active',
      requestId: 'req-1',
      details: { retryAfterMs: 500 },
    });

    expect(error).toMatchObject({
      status: 409,
      code: 'ACTIVE_RUN',
      message: 'run is active',
      requestId: 'req-1',
      details: { retryAfterMs: 500 },
    });
  });

  it('does not load another cursor page when hasMore is false', () => {
    expect(shouldLoadNextPage({ items: [{ id: 'a' }], nextCursor: null, hasMore: false })).toBe(false);
  });

  it('caches csrf token in memory and resets on demand', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' })));
    const provider = createCsrfTokenProvider(fetcher as unknown as typeof fetch, 'https://api.onmaru.test/api/v1');

    await expect(provider.getToken()).resolves.toEqual({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' });
    await provider.getToken();
    expect(fetcher).toHaveBeenCalledTimes(1);

    provider.reset();
    await provider.getToken();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('sends credentials, csrf, and idempotency key on unsafe api v1 requests', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return new Response(JSON.stringify({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' }));
      }
      return new Response(JSON.stringify({ ok: true }));
    });

    resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

    await apiRequest('/explorations', {
      method: 'POST',
      body: { query: '전주 한옥 여행' },
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      csrf: true,
    });

    expect(fetcher).toHaveBeenLastCalledWith(
      'https://api.onmaru.test/api/v1/explorations',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': '00000000-0000-4000-8000-000000000001',
          'X-CSRF-TOKEN': 'csrf-1',
        }),
      }),
    );
  });

  it('keeps compatibility paths at the backend root', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

    await apiRequest('/api/journey-curator/explore', {
      method: 'POST',
      body: { query: '경주 한옥' },
      rootPath: true,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.onmaru.test/api/journey-curator/explore',
      expect.objectContaining({ credentials: 'include' }),
    );
  });





  it('fetches the csrf token from the backend root, not under /api/v1 (FE #89)', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' })));
    resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

    await apiRequest('/explorations', {
      method: 'POST',
      body: { query: '전주 한옥 여행' },
      csrf: true,
    });

    const csrfCall = fetcher.mock.calls.find(([input]) => String(input).includes('/auth/csrf'));
    expect(csrfCall?.[0]).toBe('https://api.onmaru.test/auth/csrf');
  });

  describe('API Outage Policy (API 장애 상태 정책)', () => {
    it('classifies 503 with x-render-routing: hibernate-wake-error header as SERVER_WAKING', () => {
      const error = normalizeApiError(
        503,
        undefined,
        { 'x-render-routing': 'hibernate-wake-error' },
        ''
      );
      expect(error.classification).toBe('SERVER_WAKING');
      expect(error.code).toBe('SERVER_WAKING');
      expect(error.message).toBe('서비스를 준비하고 있어요. 첫 요청은 최대 30초 정도 걸릴 수 있습니다.');
      expect(error.isWaking).toBe(true);
    });

    it('classifies 503 with empty body fallback as SERVER_WAKING', () => {
      const error = normalizeApiError(503, undefined, {}, '');
      expect(error.classification).toBe('SERVER_WAKING');
      expect(error.code).toBe('SERVER_WAKING');
      expect(error.message).toBe('서비스를 준비하고 있어요. 첫 요청은 최대 30초 정도 걸릴 수 있습니다.');
      expect(error.isWaking).toBe(true);
    });

    it('classifies 503 with valid JSON and no wake header as SERVICE_UNAVAILABLE', () => {
      const error = normalizeApiError(
        503,
        { code: 'SERVICE_UNAVAILABLE', message: '서비스를 일시적으로 사용할 수 없습니다.' },
        {},
        '{"code":"SERVICE_UNAVAILABLE"}'
      );
      expect(error.classification).toBe('SERVICE_UNAVAILABLE');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('서비스를 일시적으로 사용할 수 없습니다.');
      expect(error.isWaking).toBe(false);
    });

    it('classifies 500 as SERVER_ERROR with default user message when body has no message', () => {
      const error = normalizeApiError(500, { requestId: 'req-err-500' }, {}, '{"requestId":"req-err-500"}');
      expect(error.classification).toBe('SERVER_ERROR');
      expect(error.message).toBe('데이터를 불러오는 중 문제가 발생했어요.');
      expect(error.requestId).toBe('req-err-500');
    });

    it('classifies 429 as RATE_LIMITED', () => {
      const error = normalizeApiError(429, { message: 'Too many requests' });
      expect(error.classification).toBe('RATE_LIMITED');
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('retries SERVICE_UNAVAILABLE up to 2 times (3 total attempts) before throwing', async () => {
      let attempts = 0;
      const fetcher = vi.fn(async () => {
        attempts++;
        return new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', message: '서비스 연결이 원활하지 않아요.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

      await expect(apiRequest('/stories', { retry: { maxRetries: 2 } })).rejects.toMatchObject({
        classification: 'SERVICE_UNAVAILABLE',
        status: 503,
      });

      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('retries SERVER_ERROR up to 1 time (2 total attempts) before throwing', async () => {
      const fetcher = vi.fn(async () => {
        return new Response(JSON.stringify({ requestId: 'req-500' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

      await expect(apiRequest('/stories', { retry: { maxRetries: 1 } })).rejects.toMatchObject({
        classification: 'SERVER_ERROR',
        status: 500,
        requestId: 'req-500',
      });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});

