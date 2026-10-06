'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRole, AdminUser } from '@/features/admin/types';
import { setAccessToken, removeAccessToken, USE_MOCK } from '@/lib/api/client';
import { isOnmaruApiError } from '@/lib/api/errors';
import {
  adminLogin,
  adminLogout,
  adminRefresh,
  adminGetMe,
  waitForAdminRefresh,
} from '@/features/admin/api/adminAuth.api';

let _memUser: AdminUser | null = null;
const userListeners = new Set<(user: AdminUser | null) => void>();

function publishUser(user: AdminUser | null) {
  _memUser = user;
  userListeners.forEach((listener) => listener(user));
}

export type AdminLoginResult =
  | { ok: true }
  | { ok: false; code: 'INVALID_CREDENTIALS' | 'SESSION_RECOVERY_FAILED' };


export function useAdminAuth() {
  const router = useRouter();
  const [user, setUserState] = useState<AdminUser | null>(_memUser);
  const [isLoading, setIsLoading] = useState(true);
  const bootstrapped = useRef(false);

  const setUser = useCallback((u: AdminUser | null) => {
    publishUser(u);
  }, []);

  useEffect(() => {
    userListeners.add(setUserState);
    return () => {
      userListeners.delete(setUserState);
    };
  }, []);

  const DEFAULT_ADMIN: AdminUser = {
    id: 'admin_usr_001',
    email: 'admin@onmaru.kr',
    nickname: '온마루지기',
    role: 'ADMIN',
    status: 'ACTIVE',
    reviewCount: 42,
    reportCount: 0,
    createdAt: '2026-01-01T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (_memUser) {
      setIsLoading(false);
      return;
    }

    if (USE_MOCK) {
      setUser(DEFAULT_ADMIN);
      setIsLoading(false);
      return;
    }

    adminRefresh()
      .then((token) => (token ? adminGetMe() : null))
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [setUser]);

  const login = useCallback(async (email: string, password: string): Promise<AdminLoginResult> => {
    setIsLoading(true);
    let loginCompleted = false;
    try {
      await waitForAdminRefresh();
      const { accessToken, user: loggedInUser } = await adminLogin(email, password);
      loginCompleted = true;
      setAccessToken(accessToken);
      if (USE_MOCK) {
        setUser(loggedInUser);
        return { ok: true };
      }
      const currentAdmin = await adminGetMe();
      setUser(currentAdmin);
      return { ok: true };
    } catch (error) {
      removeAccessToken();
      setUser(null);
      if (!loginCompleted && isOnmaruApiError(error) && error.status === 401) {
        return { ok: false, code: 'INVALID_CREDENTIALS' };
      }
      return { ok: false, code: 'SESSION_RECOVERY_FAILED' };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    await adminLogout();
    removeAccessToken();
    setUser(null);
    router.push('/admin/login');
  }, [router, setUser]);

  const role: AdminRole = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN';
  const isEditor = role === 'EDITOR' || role === 'ADMIN';

  return { user, role, isAdmin, isEditor, isLoading, login, logout };
}
