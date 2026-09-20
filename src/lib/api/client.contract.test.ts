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

  // FE #89: /auth/csrf는 백엔드 루트에 있고 /api/v1 아래가 아니다. 이전에는
  // csrf 프로바이더가 apiClientConfig 초기화 시 resolveApiBase(baseUrl)("/api/v1"이
  // 붙은 값)를 넘겨받아 실제로 .../api/v1/auth/csrf를 호출했다 — endsWith('/auth/csrf')
  // 검사는 이 접두사 오류를 잡지 못했으므로 여기서는 호출 URL 전체를 정확히 비교한다.
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
});
