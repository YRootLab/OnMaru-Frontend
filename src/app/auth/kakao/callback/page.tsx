'use client';

// ============================================================
// 카카오 로그인 콜백 처리 (src/app/auth/kakao/callback/page.tsx)
// ============================================================

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { USE_MOCK } from '@/lib/api/client';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { hasPendingSave } from '@/features/journey-curator/store/pendingSaveBridge';

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeKakaoLogin, restoreSessionAfterKakaoLogin } = useAuth();
  const { theme } = useOnmaruTheme();

  useEffect(() => {
    // 실서버 모드: 백엔드가 카카오와 code를 직접 주고받고 세션 쿠키까지 심은 뒤
    // 이 페이지로 돌려보낸다 — code는 여기 도착하지 않는다. GET /members/me만 확인하면 된다.
    if (!USE_MOCK) {
      restoreSessionAfterKakaoLogin().then((success) => {
        router.replace(success ? (hasPendingSave() ? '/' : '/mypage') : '/auth/login');
      });
      return;
    }

    const code = searchParams.get('code');
    const kakaoError = searchParams.get('error');

    if (kakaoError) {
      toast.error('카카오 로그인이 취소되었습니다.');
      router.replace('/auth/login');
      return;
    }
    if (!code) {
      toast.error('잘못된 접근입니다.');
      router.replace('/auth/login');
      return;
    }

    completeKakaoLogin(code).then((success) => {
      if (!success) {
        router.replace('/auth/login');
        return;
      }
      // 여정 저장 중 로그인으로 빠졌던 경우 저장을 마저 끝내도록 원래 화면으로 돌려보낸다.
      router.replace(hasPendingSave() ? '/' : '/mypage');
    });
  }, [searchParams, completeKakaoLogin, restoreSessionAfterKakaoLogin, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: '14px', color: theme.colors.text.muted }}>카카오 로그인 처리 중입니다...</p>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <KakaoCallbackInner />
    </Suspense>
  );
}
