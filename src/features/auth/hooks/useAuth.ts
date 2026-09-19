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

  // 초기화: 목 모드는 로컬스토리지 토큰+유저로 복원, 실서버 모드는 세션이 쿠키에 있으니
  // 캐시된 유저로 먼저 그려준 뒤 GET /members/me로 검증한다(쿠키 만료 시 로그아웃 처리).
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

  // 카카오 인가 화면으로 이동 (로그인 = 회원가입, 카카오 로그인 단일 창구)
  // 실서버 모드: 백엔드 GET /auth/kakao/login으로 브라우저를 통째로 보낸다 — code 교환은
  // 백엔드와 카카오 사이에서 끝나고, 세션 쿠키가 이미 심긴 채로 returnTo로 돌아온다.
  // 목 모드: 백엔드가 없으니 FE가 카카오 인가 URL을 직접 만들어 흉내낸다.
  const loginWithKakao = useCallback(() => {
    window.location.href = USE_MOCK
      ? buildMockKakaoAuthorizeUrl()
      : buildBackendKakaoLoginUrl(RETURN_TO_PATH);
  }, []);

  // 목 모드 전용: 콜백에서 받은 인가 code를 가짜 세션으로 교환
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

  // 실서버 전용: 백엔드가 이미 세션 쿠키를 심어놓고 returnTo로 돌려보낸 뒤 호출된다.
  // 교환할 code가 없다 — GET /members/me가 성공하면 로그인된 것이다.
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

  // FE #97: POST /auth/logout으로 서버 세션도 함께 끊는다. 실패해도(세션 만료 등)
  // 로컬 정리는 그대로 진행한다 — 로그아웃은 사용자 입장에서 항상 성공해야 한다.
  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      try {
        await defaultMemberRepository.logout();
      } catch {
        // ignore — 로컬 세션 정리는 아래에서 계속한다.
      }
    }
    removeAccessToken();
    clearPrivateClientState();
    setUser(null);
    toast.success('로그아웃했어요.');
    router.push('/');
  }, [router]);

  // 회원 탈퇴 — FE #97: DELETE /members/me. 카카오 연결 해제는 백엔드 담당,
  // 프론트는 실패해도 로컬 세션 정리만 책임진다.
  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!USE_MOCK) {
      try {
        await defaultMemberRepository.deleteMyAccount();
      } catch {
        // 세션이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다.
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
