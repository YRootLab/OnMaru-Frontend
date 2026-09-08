'use client';

// ============================================================
// 관리자 로그인 화면 (src/app/admin/login/page.tsx)
// ============================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { setAccessToken } from '@/lib/api/client';
import { AdminRole, AdminUser } from '@/admin/types';
import { IoLockClosedOutline, IoMailOutline, IoAlertCircleOutline } from 'react-icons/io5';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 처리 로직
  const handleLogin = (e?: React.FormEvent, customUser?: { email: string; role: AdminRole; nickname: string }) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const loginEmail = customUser ? customUser.email : email;
    const loginRole = customUser ? customUser.role : (email.includes('editor') ? 'EDITOR' : 'ADMIN');
    const loginNickname = customUser ? customUser.nickname : (loginRole === 'ADMIN' ? '김온마루' : '이마루');

    if (!loginEmail.trim()) {
      setErrorMessage('이메일을 입력해 주세요.');
      return;
    }

    if (!customUser && !password.trim()) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Mock 로그인 성공 처리
      const dummyToken = `onmaru_mock_token_${Date.now()}`;
      setAccessToken(dummyToken);

      const adminUser: AdminUser = {
        id: loginRole === 'ADMIN' ? 'usr-admin-01' : 'usr-editor-01',
        email: loginEmail,
        nickname: loginNickname,
        role: loginRole,
        status: 'ACTIVE',
        reviewCount: 42,
        reportCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('onmaru_admin_user', JSON.stringify(adminUser));
      }

      setIsLoading(false);
      router.push('/admin');
    }, 400);
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
        {/* 상단 헤더 및 로고 */}
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

        {/* 에러 메시지 */}
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
            <IoAlertCircleOutline size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
              이메일 주소
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IoMailOutline size={16} color={meok[400]} style={{ position: 'absolute', left: '12px' }} />
              <input
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
            <label style={{ fontSize: '12px', fontWeight: 600, color: meok[700] }}>
              비밀번호
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IoLockClosedOutline size={16} color={meok[400]} style={{ position: 'absolute', left: '12px' }} />
              <input
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

        {/* 개발용 빠른 계정 선택 안내 */}
        <div
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
              onClick={() =>
                handleLogin(undefined, { email: 'admin@onmaru.kr', role: 'ADMIN', nickname: '김온마루' })
              }
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
              onClick={() =>
                handleLogin(undefined, { email: 'editor1@onmaru.kr', role: 'EDITOR', nickname: '이마루' })
              }
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
        </div>
      </div>
    </div>
  );
}
