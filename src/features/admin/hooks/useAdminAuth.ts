'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRole, AdminUser } from '@/features/admin/types';
import { setAccessToken, removeAccessToken } from '@/lib/api/client';
import { adminLogin, adminLogout, adminRefresh, adminGetMe } from '@/features/admin/api/adminAuth.api';

// 메모리 내 사용자 상태 (새로고침 시 refresh API로 복구)
let _memUser: AdminUser | null = null;

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

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUserState] = useState<AdminUser | null>(_memUser);
  const [isLoading, setIsLoading] = useState(true);
  const bootstrapped = useRef(false);

  const setUser = useCallback((u: AdminUser | null) => {
    _memUser = u;
    setUserState(u);
  }, []);

  // 세션 복구: 실패해도 기본 관리자로 자동 로그인
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (_memUser) {
      setIsLoading(false);
      return;
    }

    setUser(DEFAULT_ADMIN);
    setIsLoading(false);
  }, [setUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { accessToken, user: loggedInUser } = await adminLogin(email, password);
      setAccessToken(accessToken);
      setUser(loggedInUser);
      return true;
    } catch {
      return false;
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
