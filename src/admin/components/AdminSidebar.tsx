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
  LayoutDashboard,
  Flame,
  AlertCircle,
  Wand2,
  Users,
  Database,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';

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
      icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
    },
    {
      label: '온기 관리',
      href: '/admin/reviews',
      icon: <Flame size={18} strokeWidth={1.75} />,
      badge: { count: 8, label: '신규' },
    },
    {
      label: '신고 처리',
      href: '/admin/reports',
      icon: <AlertCircle size={18} strokeWidth={1.75} />,
      badge: { count: 3, urgent: true, label: '대기' },
    },
    {
      label: '큐레이션',
      href: '/admin/curation',
      icon: <Wand2 size={18} strokeWidth={1.75} />,
    },
    {
      label: '사용자',
      href: '/admin/users',
      icon: <Users size={18} strokeWidth={1.75} />,
      adminOnly: true,
    },
    {
      label: '데이터',
      href: '/admin/data',
      icon: <Database size={18} strokeWidth={1.75} />,
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
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
    >
      {/* 상단 로고 및 서비스명 */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(78, 89, 104, 0.08)',
        }}
      >
        <Link
          href="/admin"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: meok[900],
              letterSpacing: '-0.02em',
            }}
          >
            온마루
          </div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              fontWeight: 600,
              color: palette.juhong[500],
              marginTop: '2px',
            }}
          >
            관리자
          </div>
        </Link>
      </div>

      {/* 메뉴 리스트 */}
      <nav
        style={{
          flex: 1,
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}
      >
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                height: '42px',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: isActive ? palette.juhong[700] : meok[700],
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive
                  ? palette.juhong[50]
                  : 'transparent',
                textDecoration: 'none',
                position: 'relative',
                transition: 'background-color 0.12s ease, color 0.12s ease',
              }}
            >
              {/* Active 표시 세로 바 */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: palette.juhong[500],
                  }}
                />
              )}

              {/* 아이콘 */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? palette.juhong[500] : meok[500],
                }}
              >
                {item.icon}
              </span>

              {/* 라벨 */}
              <span style={{ flex: 1 }}>{item.label}</span>

              {/* 뱃지 */}
              {item.badge && item.badge.count > 0 && (
                <span
                  style={{
                    minWidth: '20px',
                    height: '18px',
                    padding: '0 6px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: item.badge.urgent
                      ? palette.danpung[500]
                      : meok[200],
                    color: item.badge.urgent ? '#FFFFFF' : meok[700],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge.label ? `${item.badge.label} ${item.badge.count}` : item.badge.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 하단 로그인 계정 정보 및 제어 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(78, 89, 104, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: meok[900],
              }}
            >
              {user?.nickname ?? '관리자'}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: meok[500],
                marginTop: '1px',
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
              background: 'none',
              border: 'none',
              color: meok[500],
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={18} strokeWidth={1.75} />
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
            <ArrowLeftRight size={13} color={meok[500]} strokeWidth={1.75} />
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
