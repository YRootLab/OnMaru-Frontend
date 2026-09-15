import type { Metadata } from 'next';
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
  return <StampBook />;
}

