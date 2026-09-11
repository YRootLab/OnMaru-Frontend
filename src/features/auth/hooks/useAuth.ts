'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAccessToken, setAccessToken, removeAccessToken, apiPost, apiDelete, USE_MOCK } from '@/lib/api/client';
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
      toast.success(`${data.user.nickname}님, 환영해요!`);
      return true;
    } catch {
      toast.error('카카오 로그인에 실패했어요. 다시 시도해 주세요.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    removeAccessToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    toast.success('로그아웃했어요.');
    router.push('/');
  }, [router]);

  // 회원 탈퇴 — 카카오 연결 해제는 백엔드 담당, 프론트는 로컬 세션 정리만 책임진다.
  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!USE_MOCK) {
      try {
        await apiDelete('/api/auth/me');
      } catch {
        // 세션이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다.
      }
    }
    removeAccessToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    toast.success('탈퇴가 완료됐어요. 그동안 온마루를 이용해 주셔서 감사해요.');
    router.push('/');
  }, [router]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    loginWithKakao,
    completeKakaoLogin,
    logout,
    deleteAccount,
  };
}
