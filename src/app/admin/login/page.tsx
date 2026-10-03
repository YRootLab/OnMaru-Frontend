'use client';





import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { HugeiconsIcon } from '@hugeicons/react'
import { LockIcon, Mail01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons'

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const showQuickLogin = process.env.NODE_ENV === 'development';

  const handleLogin = async (e?: React.FormEvent, quickEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const loginEmail = quickEmail ?? email;
    const loginPassword = quickEmail ? 'dev-quicklogin' : password;

    if (!loginEmail.trim()) { setErrorMessage('이메일을 입력해 주세요.'); return; }
    if (!quickEmail && !loginPassword.trim()) { setErrorMessage('비밀번호를 입력해 주세요.'); return; }

    setIsLoading(true);
    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (result.ok) {
      router.push('/admin');
    } else if (result.code === 'INVALID_CREDENTIALS') {
      setErrorMessage('이메일 또는 비밀번호를 확인해 주세요.');
    } else {
      setErrorMessage('로그인은 성공했지만 관리자 세션을 불러오지 못했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(78, 89, 104, 0.12)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: meok[900], letterSpacing: '-0.02em' }}>
            온마루
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: palette.juhong[500],
              marginTop: '2px',
            }}
          >
            관리자 콘솔
          </div>
          <p style={{ fontSize: '13px', color: meok[500], marginTop: '8px', margin: 0 }}>
            관리자 계정으로 로그인하여 시스템을 제어하세요.
          </p>
        </div>

        {}
        {errorMessage && (
          <div
            style={{
              backgroundColor: palette.danpung[50],
              border: `1px solid ${palette.danpung[200]}`,
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: palette.danpung[700],
            }}
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={2} />
            <span>{errorMessage}</span>
          </div>
        )}

        {}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="admin-email" style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
              이메일 주소
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <HugeiconsIcon icon={Mail01Icon} size={16} color={meok[400]} strokeWidth={2} style={{ position: 'absolute', left: '12px' }} />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@onmaru.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  fontSize: '14px',
                  color: meok[900],
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="admin-password" style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
              비밀번호
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <HugeiconsIcon icon={LockIcon} size={16} color={meok[400]} strokeWidth={2} style={{ position: 'absolute', left: '12px' }} />
              <input
                id="admin-password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(78, 89, 104, 0.2)',
                  fontSize: '14px',
                  color: meok[900],
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              height: '44px',
              width: '100%',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: palette.juhong[500],
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(235, 94, 40, 0.3)',
              marginTop: '8px',
              transition: 'opacity 0.15s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '인증 확인 중...' : '로그인'}
          </button>
        </form>

        {}
        {showQuickLogin && <div
          style={{
            borderTop: '1px solid rgba(78, 89, 104, 0.08)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', color: meok[500], textAlign: 'center' }}>
            개발 테스트용 원클릭 권한 로그인:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleLogin(undefined, 'admin@onmaru.kr')}
              style={{
                height: '34px',
                borderRadius: '6px',
                border: '1px solid rgba(78, 89, 104, 0.2)',
                backgroundColor: '#FFFFFF',
                color: palette.juhong[700],
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ADMIN으로 로그인
            </button>
            <button
              type="button"
              onClick={() => handleLogin(undefined, 'editor1@onmaru.kr')}
              style={{
                height: '34px',
                borderRadius: '6px',
                border: '1px solid rgba(78, 89, 104, 0.2)',
                backgroundColor: '#FFFFFF',
                color: palette.cheongrok[700],
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              EDITOR로 로그인
            </button>
          </div>
        </div>}
      </div>
    </div>
  );
}
