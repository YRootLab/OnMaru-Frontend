'use client';

// ============================================================
// 관리자 공통 레이아웃 & 인증/인가 가드 (src/app/admin/layout.tsx)
// ============================================================

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import { AdminSidebar } from '@/admin/components/AdminSidebar';
import { AdminHeader } from '@/admin/components/AdminHeader';
import { meok, palette } from '@/design-system/tokens';
import { ShieldAlert, Lock } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isAdmin, isEditor, isLoading, logout } = useAdminAuth();

  const isLoginPage = pathname === '/admin/login';

  // 미로그인 사용자 리다이렉트
  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // 로그인 페이지는 사이드바/헤더 없이 독립 렌더링
  if (isLoginPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    );
  }

  // 초기 인증 로딩 화면
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: meok[500],
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <span>관리자 세션 확인 중...</span>
      </div>
    );
  }

  // 일반 USER 권한 차단 화면
  if (user && role === 'USER') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '32px',
            backgroundColor: palette.danpung[50],
            color: palette.danpung[500],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '20px',
          }}
        >
          <ShieldAlert size={32} strokeWidth={1.8} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: meok[900], marginBottom: '8px' }}>
          접근 권한이 없습니다
        </h2>
        <p style={{ fontSize: '14px', color: meok[500], maxWidth: '380px', lineHeight: 1.6, marginBottom: '24px' }}>
          이 페이지는 관리자(ADMIN) 또는 에디터(EDITOR) 권한을 가진 계정만 접근할 수 있습니다.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid rgba(78, 89, 104, 0.15)',
              backgroundColor: '#FFFFFF',
              color: meok[700],
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다른 계정으로 로그인
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: palette.juhong[500],
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            서비스 메인으로
          </button>
        </div>
      </div>
    );
  }

  // EDITOR 권한이 ADMIN 전용 메뉴(users, data)에 접근할 경우 차단
  const isAdminOnlyRoute = pathname.startsWith('/admin/users') || pathname.startsWith('/admin/data');
  if (isEditor && !isAdmin && isAdminOnlyRoute) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
        <AdminSidebar />
        <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <AdminHeader />
          <main style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: meok[200],
                color: meok[500],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px',
              }}
            >
              <Lock size={28} strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: meok[900], marginBottom: '6px' }}>
              최고 관리자(ADMIN) 전용 메뉴입니다
            </h3>
            <p style={{ fontSize: '13px', color: meok[500], marginBottom: '20px' }}>
              사용자 및 데이터 파이프라인 관리는 최고 관리자만 접근할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: palette.juhong[500],
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              대시보드로 돌아가기
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      <AdminSidebar />
      <div
        style={{
          marginLeft: '240px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AdminHeader />
        <main
          style={{
            padding: '28px',
            maxWidth: '1400px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
