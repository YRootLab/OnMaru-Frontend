'use client';

// ============================================================
// 로그인 / 회원가입 페이지 — 카카오 로그인 단일 창구 (src/app/auth/login/page.tsx)
// ============================================================

import { useAuth } from '@/features/auth';
import { meok } from '@/design-system/tokens';

export default function LoginPage() {
  const { loginWithKakao } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 20px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: meok[900], letterSpacing: '-0.02em' }}>
            온마루
          </div>
          <p style={{ fontSize: '14px', color: meok[500], margin: 0, lineHeight: 1.5 }}>
            카카오 계정으로 로그인하고
            <br />
            온마루의 모든 이야기를 만나보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={loginWithKakao}
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#FEE500',
            color: '#191919',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <KakaoBubbleIcon />
          카카오로 시작하기
        </button>

        <p style={{ fontSize: '12px', color: meok[400], textAlign: 'center', margin: 0 }}>
          별도의 회원가입 없이, 카카오 로그인만으로 온마루 이용을 시작할 수 있어요.
        </p>
      </div>
    </div>
  );
}

function KakaoBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5C4.58 1.5 1 4.28 1 7.71c0 2.19 1.47 4.12 3.68 5.23-.16.6-.6 2.2-.69 2.54-.11.42.15.42.32.3.13-.09 2.1-1.43 2.96-2.02.55.08 1.12.12 1.73.12 4.42 0 8-2.78 8-6.17S13.42 1.5 9 1.5Z"
        fill="#191919"
      />
    </svg>
  );
}
