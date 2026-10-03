'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { USE_MOCK } from '@/lib/api/client';
import { useAuth } from './useAuth';
import { buildAuthReturnCleanup, parseAuthReturnParam } from '../services/authReturn';
import { hasPendingSave } from '@/features/journey-curator/store/pendingSaveBridge';

/*
  카카오 로그인 복귀 감지 — 가이드 §1-2.

  백엔드가 카카오 콜백을 대신 받고, 끝나면 `{returnTo}?auth=success|failed`로
  브라우저를 돌려보낸다. 콜백 전용 페이지 대신 이 전역 핸들러가 루트에 마운트되어
  모든 페이지에서 `?auth=` 쿼리를 파싱한다.

  - success: 세션 쿠키가 이미 발급돼 있으므로 GET /members/me로 확정하고,
    여정 저장 중 로그인으로 빠졌다면 저장을 마저 끝낸다.
  - failed: 안내만 하고 끝낸다. 게스트 쿠키·게스트 탐색은 보존되므로 바로 재시도 가능.
  처리 후 쿼리를 정리해 새로고침 시 중복 처리되지 않게 한다.
  파싱·정리 로직은 services/authReturn.ts의 순수 함수가 담당하며(BE/FE 원인
  판별 계약 테스트의 대상), 이 훅은 네비게이션만 수행한다.
*/

export function useAuthReturn(): void {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshSessionAfterKakaoLogin, completeMockKakaoLogin } = useAuth();
  const handledAuthValue = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const auth = parseAuthReturnParam(window.location.search);
    if (!auth) return;
    // 같은 ?auth= 값은 한 번만 처리한다(React 18 StrictMode 이중 마운트 방어).
    if (handledAuthValue.current === auth) return;
    handledAuthValue.current = auth;

    let cancelled = false;
    const run = async () => {
      if (auth === 'success') {
        const success = USE_MOCK ? completeMockKakaoLogin() : await refreshSessionAfterKakaoLogin();
        if (cancelled) return;
        if (success && hasPendingSave()) {
          // 여정 저장 intent가 살아있다면 원래 화면에서 저장을 마저 끝내게 한다.
          router.replace('/');
          return;
        }
      } else {
        // 실패해도 게스트 상태는 보존된다 — 안내 후 재시도 가능.
        toast.error('카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
      if (cancelled) return;

      // 쿼리를 정리해 뒤로 가기·새로고침에 재처리되지 않게 한다.
      router.replace(buildAuthReturnCleanup(pathname, window.location.search), { scroll: false });
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, refreshSessionAfterKakaoLogin, completeMockKakaoLogin]);
}
