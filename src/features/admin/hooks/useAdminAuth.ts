'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRole, AdminUser } from '@/features/admin/types';
import { setAccessToken, removeAccessToken, USE_MOCK, getAccessToken } from '@/lib/api/client';
import { adminLogin, adminLogout, adminRefresh, adminGetMe } from '@/features/admin/api/adminAuth.api';

// 메모리 내 사용자 상태 — 여러 훅 인스턴스(레이아웃·로그인 페이지)가 공유
let _memUser: AdminUser | null = null;
const _userListeners = new Set<(u: AdminUser | null) => void>();

function broadcastUser(u: AdminUser | null) {
  _memUser = u;
  _userListeners.forEach((l) => l(u));
}

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUserState] = useState<AdminUser | null>(_memUser);
  const [isLoading, setIsLoading] = useState(true);
  const bootstrapped = useRef(false);

  // 다른 인스턴스의 로그인/로그아웃을 구독해 state 동기화
  useEffect(() => {
    const listener = (u: AdminUser | null) => setUserState(u);
    _userListeners.add(listener);
    return () => { _userListeners.delete(listener); };
  }, []);

  const setUser = useCallback((u: AdminUser | null) => {
    broadcastUser(u);
    setUserState(u);
  }, []);

  // 새로고침 시 refresh로 세션 복구
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (USE_MOCK) {
      // mock 환경: 이전에 설정된 메모리 사용자 또는 기본값
      if (!_memUser) {
        const mockUser: AdminUser = {
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
        setAccessToken('mock_admin_jwt');
        setUser(mockUser);
      }
      setIsLoading(false);
      return;
    }

    // 이미 access token이 메모리에 있으면 복구 불필요
    if (getAccessToken() && _memUser) {
      setIsLoading(false);
      return;
    }

    // refresh cookie로 세션 복구 시도
    adminRefresh()
      .then((token) => token ? adminGetMe().then(setUser) : undefined)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
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
