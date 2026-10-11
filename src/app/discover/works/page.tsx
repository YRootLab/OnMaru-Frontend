import type { Metadata } from 'next';
import DiscoveryWorksPage from '@/features/k-culture-discovery/DiscoveryWorksPage';

export const metadata: Metadata = {
  title: '작품 목록 — 탐색마루 | 온마루',
  description: 'K-드라마, 영화, 예능, 뮤직비디오 등 K-Culture 작품 목록을 탐색하세요.',
  openGraph: {
    title: '작품 목록 — 온마루',
    description: 'K-Culture 작품을 탐색하다',
    type: 'website',
  },
};

export default function WorksPage() {
  return <DiscoveryWorksPage />;
}
