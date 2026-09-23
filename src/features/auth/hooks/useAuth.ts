'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { USE_MOCK } from '@/lib/api/client';
import { buildBackendKakaoLoginUrl } from '../api/kakaoAuth';
import { clearPrivateClientState, markSessionHint } from '../privateState';
import { defaultMemberRepository } from '../api/memberApi';
import { useAuthSessionStore } from '../store/useAuthSessionStore';
import { resolveKakaoLoginReturnTo } from '../services/authReturn';

// 여정 저장 중 로그인으로 빠졌을 때 돌아올 곳. pendingSaveBridge(journey-curator)의
// sessionStorage 키와 같은 값이다 — feature 간 직접 import 금지 규칙 때문에 문자열로만 맞춘다.
const PENDING_SAVE_KEY = 'onmaru_pending_save_v1';
// 목 모드용 흉내 세션 플래그(가이드 §3의 "Auth 키만 유지"를 sessionStorage로 흉내낸 것).
const MOCK_SESSION_KEY = 'onmaru.mock_session';
const MOCK_USER_ID = 'mock_guest';
const MOCK_USER_NAME = '온마루 여행자';

export function useAuth() {
  const router = useRouter();
  const user = useAuthSessionStore((s) => s.user);
  const ensureSessionLoaded = useAuthSessionStore((s) => s.ensureSessionLoaded);
  const applyProfile = useAuthSessionStore((s) => s.applyProfile);
  const clearSession = useAuthSessionStore((s) => s.clear);

  // 세션 쿠키(HttpOnly)로만 로그인 여부를 알 수 있으니 마운트 시 서버에 물어본다.
  // 실서버: GET /members/me (200 = 로그인, 401 = 비로그인, 자동 재시도 없음 — 가이드 §1-5).
  // 목 모드: 백엔드가 없으니 비로그인으로 시작하고, ?auth=success 복귀 시 흉내로 세션 생성.
  useEffect(() => {
    if (!USE_MOCK) {
      void ensureSessionLoaded();
      return;
    }
    // 목 모드: 백엔드가 없으니 sessionStorage 플래그로 세션을 복원한다.
    if (window.sessionStorage.getItem(MOCK_SESSION_KEY)) {
      applyProfile({ id: MOCK_USER_ID, displayName: MOCK_USER_NAME });
    } else {
      clearSession();
    }
  }, [USE_MOCK, applyProfile, clearSession, ensureSessionLoaded]);

  // 카카오 로그인 시작 (로그인 = 회원가입, 카카오 로그인 단일 창구).
  // FE는 카카오와 직접 통신하지 않는다(가이드 §0) — 백엔드 GET /auth/kakao/login으로
  // 브라우저를 통째로 보내면 code 교환·세션 발급이 백엔드에서 끝나고
  // `{returnTo}?auth=success|failed`로 돌아온다(useAuthReturn에서 파싱).
  const loginWithKakao = useCallback(() => {
    let returnTo = '/mypage';
    if (typeof window !== 'undefined') {
      returnTo = resolveKakaoLoginReturnTo({
        pathname: window.location.pathname,
        search: window.location.search,
        // 저장 intent가 대기 중이면 홈으로 돌아와 마저 저장한다.
        hasPendingSave: Boolean(window.sessionStorage.getItem(PENDING_SAVE_KEY)),
      });
    }

    if (USE_MOCK) {
      // 목 모드: 백엔드가 없으니 백엔드 왕복을 흉내낸다 — returnTo로 이동해
      // useAuthReturn이 ?auth=success를 파싱해 세션을 만들게 한다.
      const sep = returnTo.includes('?') ? '&' : '?';
      window.location.href = `${returnTo}${sep}auth=success`;
      return;
    }
    window.location.href = buildBackendKakaoLoginUrl(returnTo);
  }, []);

  // 목 모드 전용: 백엔드 왕복 없이 세션을 흉내낸다(?auth=success 복귀 시 호출).
  const completeMockKakaoLogin = useCallback((): boolean => {
    window.sessionStorage.setItem(MOCK_SESSION_KEY, '1');
    markSessionHint();
    const nextUser = applyProfile({ id: MOCK_USER_ID, displayName: MOCK_USER_NAME });
    toast.success(`${nextUser.displayName}님, 환영해요!`);
    return true;
  }, [applyProfile]);

  // ?auth=success 복귀 후 호출 — 백엔드가 이미 세션 쿠키를 심었으니 /members/me로 확정한다.
  const refreshSessionAfterKakaoLogin = useCallback(async (): Promise<boolean> => {
    try {
      const profile = await defaultMemberRepository.getMyProfile();
      markSessionHint();
      const nextUser = applyProfile(profile);
      toast.success(`${nextUser.displayName}님, 환영해요!`);
      return true;
    } catch {
      // 401 AUTH_REQUIRED 등 — 게스트 상태는 보존되므로 바로 재시도 가능하다.
      toast.error('카카오 로그인에 실패했어요. 다시 시도해 주세요.');
      return false;
    }
  }, [applyProfile]);

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
    window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    clearPrivateClientState();
    clearSession();
    toast.success('로그아웃했어요.');
    router.push('/');
  }, [router, clearSession]);

  // 회원 탈퇴 — DELETE /members/me → 202 {status:"DELETING"}(비동기 접수). 카카오 연결
  // 해제는 백엔드 담당, 프론트는 실패해도 로컬 세션 정리만 책임진다.
  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!USE_MOCK) {
      try {
        await defaultMemberRepository.deleteMyAccount();
      } catch {
        // 세션이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다.
      }
    }
    window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    clearPrivateClientState();
    clearSession();
    toast.success('탈퇴가 완료됐어요. 그동안 온마루를 이용해 주셔서 감사해요.');
    router.push('/');
  }, [router, clearSession]);

  return {
    user: user ?? null,
    // 세션이 확정되기 전(서버 확인 중)엔 로딩으로 취급해 비로그인 판정 선회를 막는다.
    isLoading: user === undefined,
    isLoggedIn: !!user,
    loginWithKakao,
    completeMockKakaoLogin,
    refreshSessionAfterKakaoLogin,
    logout,
    deleteAccount,
  };
}
