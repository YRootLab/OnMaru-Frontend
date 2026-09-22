'use client';





import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import { ExternalLink } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/admin': '운영 대시보드',
  '/admin/reviews': '온기(후기) 관리',
  '/admin/reports': '신고 콘텐츠 처리',
  '/admin/curation': '한옥 큐레이션 관리',
  '/admin/users': '사용자 및 권한 관리',
  '/admin/data': '데이터 파이프라인 콘솔',
};

export const AdminHeader: React.FC = () => {
  const pathname = usePathname();


  const title =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith('/admin/reviews')
      ? '온기(후기) 관리'
      : pathname.startsWith('/admin/reports')
      ? '신고 콘텐츠 처리'
      : pathname.startsWith('/admin/curation')
      ? '한옥 큐레이션 관리'
      : pathname.startsWith('/admin/users')
      ? '사용자 및 권한 관리'
      : pathname.startsWith('/admin/data')
      ? '데이터 파이프라인 콘솔'
      : '관리자 콘솔');

  return (
    <header
      style={{
        height: '60px',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(78, 89, 104, 0.08)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}
    >
      <h1
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: meok[900],
          margin: 0,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h1>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '13px',
          fontWeight: 600,
          color: palette.juhong[500],
          textDecoration: 'none',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(78, 89, 104, 0.12)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          transition: 'background-color 0.12s ease',
        }}
      >
        <span>서비스로 이동</span>
        <ExternalLink size={14} strokeWidth={2} />
      </Link>
    </header>
  );
};
