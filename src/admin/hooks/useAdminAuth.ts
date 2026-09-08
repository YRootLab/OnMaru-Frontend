'use client';

// ============================================================
// 관리자 세션 및 권한 관리 훅 (src/admin/hooks/useAdminAuth.ts)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRole, AdminUser } from '@/admin/types';
import { getAccessToken, setAccessToken, removeAccessToken, USE_MOCK } from '@/lib/api/client';

const DEFAULT_MOCK_USER: AdminUser = {
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
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 초기화: 로컬스토리지 토큰 및 사용자 정보 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAccessToken();
    const storedUserStr = localStorage.getItem('onmaru_admin_user');

    if (token && storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr) as AdminUser;
        setUser(parsed);
      } catch {
        setUser(DEFAULT_MOCK_USER);
      }
    } else if (USE_MOCK) {
      // Mock 모드에서는 기본 관리자 세션을 주입하여 즉시 작업 가능하도록 지원
      setAccessToken('mock_admin_jwt_token_development');
      localStorage.setItem('onmaru_admin_user', JSON.stringify(DEFAULT_MOCK_USER));
      setUser(DEFAULT_MOCK_USER);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const role: AdminRole = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN';
  const isEditor = role === 'EDITOR' || role === 'ADMIN';

  // 로그인 함수 (Mock 또는 실제 API 연동)
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (USE_MOCK) {
        // 모의 로그인
        const mockUser: AdminUser = {
          ...DEFAULT_MOCK_USER,
          email,
          nickname: email.split('@')[0] || '관리자',
        };
        setAccessToken('mock_admin_jwt_token_development');
        localStorage.setItem('onmaru_admin_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoading(false);
        return true;
      }

      // 실제 백엔드 연동은 나중에 BASE_URL 주입 시 활성화
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(() => {
    removeAccessToken();
    setUser(null);
    router.push('/admin/login');
  }, [router]);

  // 개발 편의를 위한 Role 스위처
  const setRole = useCallback((newRole: AdminRole) => {
    if (!user) return;
    const updated: AdminUser = { ...user, role: newRole };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onmaru_admin_user', JSON.stringify(updated));
    }
  }, [user]);

  return {
    user,
    role,
    isAdmin,
    isEditor,
    isLoading,
    login,
    logout,
    setRole,
  };
}
