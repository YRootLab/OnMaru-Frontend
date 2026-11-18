import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '한옥 지도 — 온마루',
  description: '전국 한옥마을과 고택을 지도에서 봅니다.',
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
