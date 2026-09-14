import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StampBook } from '@/features/stamp';

export const metadata: Metadata = {
  title: '수결첩 — 나의 전국 한옥 탐방 인장첩 | 온마루',
  description: '전국 8도의 아름다운 한옥과 고택을 방문하고 모으는 나만의 전통 수결(스탬프) 도감입니다.',
  openGraph: {
    title: '한옥 수결첩 — 온마루',
    description: '전국 한옥 방문 인장을 모으는 디지털 수결첩',
    type: 'website',
  },
};

export default function StampsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-light-card, #f8f8f7)' }}>
      {/* Top Nav Bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(25, 31, 40, 0.06)',
        }}
      >
        <Link
          href="/map"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>지도로 돌아가기</span>
        </Link>
        <Link
          href="/"
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: 'inherit',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          온마루 (ONMARU)
        </Link>
      </nav>

      <StampBook />
    </main>
  );
}
