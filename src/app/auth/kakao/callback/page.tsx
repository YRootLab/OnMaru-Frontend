'use client';

// ============================================================
// 카카오 로그인 콜백 처리 (src/app/auth/kakao/callback/page.tsx)
// ============================================================

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { meok, palette } from '@/design-system/tokens';

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeKakaoLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const kakaoError = searchParams.get('error');

    if (kakaoError) {
      setError('카카오 로그인이 취소되었습니다.');
      return;
    }
    if (!code) {
      setError('잘못된 접근입니다.');
      return;
    }

    completeKakaoLogin(code).then((success) => {
      router.replace(success ? '/' : '/auth/login');
    });
  }, [searchParams, completeKakaoLogin, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: '14px', color: error ? palette.danpung[700] : meok[500] }}>
        {error ?? '카카오 로그인 처리 중입니다...'}
      </p>
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
