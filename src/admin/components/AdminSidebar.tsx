'use client';

// ============================================================
// 관리자 사이드바 (src/admin/components/AdminSidebar.tsx)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { palette, meok } from '@/design-system/tokens';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import {
  IoGridOutline,
  IoFlameOutline,
  IoWarningOutline,
  IoColorWandOutline,
  IoPeopleOutline,
  IoServerOutline,
  IoLogOutOutline,
  IoSwapHorizontalOutline,
} from 'react-icons/io5';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: {
    count: number;
    urgent?: boolean;
    label?: string;
  };
  adminOnly?: boolean;
}

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, isAdmin, logout, setRole } = useAdminAuth();

  const navItems: NavItem[] = [
    {
      label: '대시보드',
      href: '/admin',
      icon: <IoGridOutline size={18} />,
    },
    {
      label: '온기 관리',
      href: '/admin/reviews',
      icon: <IoFlameOutline size={18} />,
      badge: { count: 8, label: '신규' },
    },
    {
      label: '신고 처리',
      href: '/admin/reports',
      icon: <IoWarningOutline size={18} />,
      badge: { count: 3, urgent: true, label: '대기' },
    },
    {
      label: '큐레이션',
      href: '/admin/curation',
      icon: <IoColorWandOutline size={18} />,
    },
    {
      label: '사용자',
      href: '/admin/users',
      icon: <IoPeopleOutline size={18} />,
      adminOnly: true,
    },
    {
      label: '데이터',
      href: '/admin/data',
      icon: <IoServerOutline size={18} />,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid rgba(78, 89, 104, 0.10)',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {/* 상단 로고 & 내비게이션 */}
      <div>
        <div
          style={{
            padding: '0 20px 24px',
            borderBottom: '1px solid rgba(78, 89, 104, 0.08)',
          }}
        >
          <Link
            href="/admin"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: meok[900],
                letterSpacing: '-0.02em',
              }}
            >
              온마루
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: palette.juhong[500],
              }}
            >
              관리자 콘솔
            </span>
          </Link>
        </div>

        {/* 메뉴 리스트 */}
        <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  fontSize: '14px',
                  color: isActive ? palette.juhong[700] : meok[700],
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? palette.juhong[50] : 'transparent',
                  borderLeft: isActive ? `3px solid ${palette.juhong[500]}` : '3px solid transparent',
                  transition: 'background-color 0.12s ease, color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(78, 89, 104, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'flex', color: isActive ? palette.juhong[500] : meok[500] }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge.count > 0 && (
                  <span
                    style={{
                      minWidth: '20px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: item.badge.urgent ? palette.danpung[500] : meok[200],
                      color: item.badge.urgent ? '#FFFFFF' : meok[700],
                    }}
                  >
                    {item.badge.label ? `${item.badge.label} ${item.badge.count}` : item.badge.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 하단 로그인 계정 정보 및 편의 기능 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(78, 89, 104, 0.08)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: meok[900],
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.nickname || '관리자'}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: role === 'ADMIN' ? palette.juhong[500] : palette.cheongrok[700],
                letterSpacing: '0.04em',
              }}
            >
              {role}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            title="로그아웃"
            style={{
              border: 'none',
              background: 'transparent',
              color: meok[500],
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'color 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = palette.danpung[500])}
            onMouseLeave={(e) => (e.currentTarget.style.color = meok[500])}
          >
            <IoLogOutOutline size={18} />
          </button>
        </div>

        {/* 개발 환경 전용 권한 전환 스위처 */}
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: meok[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: meok[700],
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IoSwapHorizontalOutline size={13} color={meok[500]} />
            <span>Role:</span>
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '11px',
              fontWeight: 600,
              color: palette.juhong[700],
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>
    </aside>
  );
};
