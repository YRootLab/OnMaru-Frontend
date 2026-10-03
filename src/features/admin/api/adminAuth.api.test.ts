import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('adminRefresh', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.onmaru.test');
  });

  it('fetches csrf first and includes its dynamic header and credentials in refresh', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return new Response(JSON.stringify({ token: 'admin-csrf', headerName: 'X-ADMIN-CSRF' }));
      }
      return new Response(JSON.stringify({ accessToken: 'admin-access' }));
    });
    const client = await import('@/lib/api/client');
    client.resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });
    const { adminRefresh } = await import('./adminAuth.api');

    await expect(adminRefresh()).resolves.toBe('admin-access');

    expect(fetcher.mock.calls.map(([input]) => String(input))).toEqual([
      'https://api.onmaru.test/auth/csrf',
      'https://api.onmaru.test/api/v1/auth/admin/refresh',
    ]);
    expect(fetcher.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'X-ADMIN-CSRF': 'admin-csrf' }),
    }));
  });

  it('shares one refresh request across concurrent callers', async () => {
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => { releaseRefresh = resolve; });
    const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return new Response(JSON.stringify({ token: 'admin-csrf', headerName: 'X-CSRF-TOKEN' }));
      }
      await refreshGate;
      return new Response(JSON.stringify({ accessToken: 'shared-access' }));
    });
    const client = await import('@/lib/api/client');
    client.resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });
    const { adminRefresh } = await import('./adminAuth.api');

    const first = adminRefresh();
    const second = adminRefresh();
    const third = adminRefresh();
    expect(second).toBe(first);
    expect(third).toBe(first);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    releaseRefresh();

    await expect(Promise.all([first, second, third])).resolves.toEqual([
      'shared-access',
      'shared-access',
      'shared-access',
    ]);
    expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/auth/admin/refresh'))).toHaveLength(1);
  });

  it('does not recursively refresh when the refresh endpoint returns 401', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return new Response(JSON.stringify({ token: 'admin-csrf', headerName: 'X-CSRF-TOKEN' }));
      }
      return new Response(JSON.stringify({ code: 'AUTH_REQUIRED' }), { status: 401 });
    });
    const client = await import('@/lib/api/client');
    client.resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });
    client.setAccessToken('expired-access');
    const { adminRefresh } = await import('./adminAuth.api');

    await expect(adminRefresh()).rejects.toMatchObject({ status: 401 });

    const refreshCalls = fetcher.mock.calls.filter(([input]) => String(input).endsWith('/auth/admin/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(refreshCalls[0]?.[1]).toEqual(expect.objectContaining({
      headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
    }));
  });
});
