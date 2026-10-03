// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeApiError } from '@/lib/api/errors';
import { useAdminAuth } from './useAdminAuth';

const {
  push,
  adminLogin,
  adminRefresh,
  waitForAdminRefresh,
  adminGetMe,
  adminLogout,
  setAccessToken,
  removeAccessToken,
} = vi.hoisted(() => ({
  push: vi.fn(),
  adminLogin: vi.fn(),
  adminRefresh: vi.fn(),
  waitForAdminRefresh: vi.fn(),
  adminGetMe: vi.fn(),
  adminLogout: vi.fn(),
  setAccessToken: vi.fn(),
  removeAccessToken: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/features/admin/api/adminAuth.api', () => ({
  adminLogin,
  adminLogout,
  adminRefresh,
  waitForAdminRefresh,
  adminGetMe,
}));
vi.mock('@/lib/api/client', () => ({
  USE_MOCK: false,
  setAccessToken,
  removeAccessToken,
}));

const adminUser = {
  id: 'admin-1',
  email: 'admin@onmaru.kr',
  nickname: '관리자',
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  reviewCount: 0,
  reportCount: 0,
  createdAt: '2026-10-03T00:00:00Z',
  lastLoginAt: '2026-10-03T00:00:00Z',
};

describe('useAdminAuth login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminRefresh.mockResolvedValue(null);
    waitForAdminRefresh.mockResolvedValue(undefined);
    adminGetMe.mockResolvedValue(adminUser);
  });

  afterEach(cleanup);

  it('returns success after login, refresh, and current-admin recovery all succeed', async () => {
    adminLogin.mockResolvedValue({ accessToken: 'login-access', user: adminUser });
    adminRefresh.mockResolvedValue('refreshed-access');
    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('admin@onmaru.kr', 'password')).resolves.toEqual({ ok: true });
    });

    expect(adminRefresh).toHaveBeenCalled();
    expect(adminGetMe).toHaveBeenCalled();
    expect(result.current.user).toEqual(adminUser);
  });

  it('waits for a pre-login refresh to settle before posting credentials', async () => {
    let releaseBootstrap!: () => void;
    waitForAdminRefresh.mockImplementation(() => new Promise<void>((resolve) => { releaseBootstrap = resolve; }));
    adminLogin.mockResolvedValue({ accessToken: 'login-access', user: adminUser });
    adminRefresh.mockResolvedValue('refreshed-access');
    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>> | undefined;
    act(() => {
      void result.current.login('admin@onmaru.kr', 'password').then((value) => { loginResult = value; });
    });
    await waitFor(() => expect(waitForAdminRefresh).toHaveBeenCalled());
    expect(adminLogin).not.toHaveBeenCalled();

    releaseBootstrap();
    await waitFor(() => expect(loginResult).toEqual({ ok: true }));
    expect(adminLogin).toHaveBeenCalledTimes(1);
  });

  it('classifies only a 401 login response as invalid credentials', async () => {
    adminLogin.mockRejectedValue(normalizeApiError(401, { code: 'INVALID_CREDENTIALS' }));
    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('admin@onmaru.kr', 'wrong')).resolves.toEqual({
        ok: false,
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  it('classifies a post-login refresh failure as session recovery failure', async () => {
    adminLogin.mockResolvedValue({ accessToken: 'login-access', user: adminUser });
    adminRefresh.mockRejectedValue(normalizeApiError(403, { code: 'CSRF_INVALID' }));
    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('admin@onmaru.kr', 'password')).resolves.toEqual({
        ok: false,
        code: 'SESSION_RECOVERY_FAILED',
      });
    });
  });
});
