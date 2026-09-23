'use client';

// ============================================================
// 카카오 로그인 콜백 (src/app/auth/kakao/callback/page.tsx)
//
// 백엔드가 카카오 code를 직접 받으므로(가이드 §0) 이 페이지는 FE가 returnTo로
// 넘겨주지 않는다. 예전 북마크·링크 등으로 진입한 경우만 방어한다: ?auth= 쿼리가
// 있으면 전역 useAuthReturn 핸들러가 처리하고, 없으면 로그인 페이지로 보낸다.
// ============================================================

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';

function KakaoCallbackInner() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useAuth();
  const { theme } = useOnmaruTheme();

  useEffect(() => {
    const hasAuthQuery = new URLSearchParams(window.location.search).has('auth');
    // ?auth=가 있으면 전역 useAuthReturn이 처리한다(성공 시 세션 확정 + 저장 intent 마무리).
    if (hasAuthQuery) return;
    // 세션 확인이 끝났는데도 로그인 상태가 아니면 로그인 페이지로 보낸다.
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isLoggedIn, router]);

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
