'use client';

// ============================================================
// 카카오 로그인 콜백 처리 (src/app/auth/kakao/callback/page.tsx)
// ============================================================

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { hasPendingSave } from '@/features/journey-curator/store/pendingSaveBridge';

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeKakaoLogin } = useAuth();
  const { theme } = useOnmaruTheme();

  useEffect(() => {
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
  }, [searchParams, completeKakaoLogin, router]);

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
