'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken, removeAccessToken, apiPost, USE_MOCK } from '@/lib/api/client';
import { OnmaruUser } from '../types';
import { buildKakaoAuthorizeUrl } from '../api/kakaoAuth';

const USER_STORAGE_KEY = 'onmaru_user';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<OnmaruUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화: 로컬스토리지 토큰 및 사용자 정보 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAccessToken();
    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
    if (token && storedUserStr) {
      try {
        setUser(JSON.parse(storedUserStr) as OnmaruUser);
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // 카카오 인가 화면으로 이동 (로그인 = 회원가입, 카카오 로그인 단일 창구)
  const loginWithKakao = useCallback(() => {
    window.location.href = buildKakaoAuthorizeUrl();
  }, []);

  // 콜백에서 받은 인가 code를 우리 서버 세션으로 교환
  const completeKakaoLogin = useCallback(async (code: string): Promise<boolean> => {
    try {
      const data = USE_MOCK
        ? {
            accessToken: `mock_kakao_jwt_${Date.now()}`,
            user: { id: `kakao_${code.slice(0, 8)}`, nickname: '온마루 여행자' } as OnmaruUser,
          }
        : await apiPost<{ accessToken: string; user: OnmaruUser }>('/api/auth/kakao/login', { code });

      setAccessToken(data.accessToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    removeAccessToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    router.push('/');
  }, [router]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    loginWithKakao,
    completeKakaoLogin,
    logout,
  };
}
