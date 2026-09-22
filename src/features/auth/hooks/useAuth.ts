'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAccessToken, setAccessToken, removeAccessToken, USE_MOCK } from '@/lib/api/client';
import { OnmaruUser } from '../types';
import { buildMockKakaoAuthorizeUrl, buildBackendKakaoLoginUrl } from '../api/kakaoAuth';
import { clearPrivateClientState } from '../privateState';
import { defaultMemberRepository, type MemberProfile } from '../api/memberApi';

const RETURN_TO_PATH = '/auth/kakao/callback';

function toOnmaruUser(profile: MemberProfile): OnmaruUser {
  return {
    id: profile.id,
    nickname: profile.nickname,
    email: profile.email ?? undefined,
    profileImage: profile.profileImageUrl ?? undefined,
  };
}

const USER_STORAGE_KEY = 'onmaru_user';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<OnmaruUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);

    if (USE_MOCK) {
      const token = getAccessToken();
      if (token && storedUserStr) {
        try {
          setUser(JSON.parse(storedUserStr) as OnmaruUser);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
      return;
    }

    if (storedUserStr) {
      try {
        setUser(JSON.parse(storedUserStr) as OnmaruUser);
      } catch {
        setUser(null);
      }
    }
    defaultMemberRepository
      .getMyProfile()
      .then((profile) => {
        const nextUser = toOnmaruUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      })
      .catch(() => {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);





  const loginWithKakao = useCallback(() => {
    window.location.href = USE_MOCK
      ? buildMockKakaoAuthorizeUrl()
      : buildBackendKakaoLoginUrl(RETURN_TO_PATH);
  }, []);


  const completeKakaoLogin = useCallback(async (code: string): Promise<boolean> => {
    try {
      const data = {
        accessToken: `mock_kakao_jwt_${Date.now()}`,
        user: { id: `kakao_${code.slice(0, 8)}`, nickname: '온마루 여행자' } as OnmaruUser,
      };

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



  const restoreSessionAfterKakaoLogin = useCallback(async (): Promise<boolean> => {
    try {
      const profile = await defaultMemberRepository.getMyProfile();
      const nextUser = toOnmaruUser(profile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      toast.success(`${nextUser.nickname}님, 환영해요!`);
      return true;
    } catch {
      toast.error('카카오 로그인에 실패했어요. 다시 시도해 주세요.');
      return false;
    }
  }, []);



  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      try {
        await defaultMemberRepository.logout();
      } catch {

      }
    }
    removeAccessToken();
    clearPrivateClientState();
    setUser(null);
    toast.success('로그아웃했어요.');
    router.push('/');
  }, [router]);



  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!USE_MOCK) {
      try {
        await defaultMemberRepository.deleteMyAccount();
      } catch {

      }
    }
    removeAccessToken();
    clearPrivateClientState();
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
    restoreSessionAfterKakaoLogin,
    logout,
    deleteAccount,
  };
}
