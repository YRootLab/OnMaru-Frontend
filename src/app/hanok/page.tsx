import type { Metadata } from 'next';
import HanokArchive from '@/hanok/HanokArchive';
import { HANOK_ARCHIVE_FALLBACK } from '@/hanok/data/hanokArchiveFallback';

export const metadata: Metadata = {
  title: '한옥도감 — 실시간 전국 전통 한옥 & 문화유산 도감 | 온마루',
  description:
    'TourAPI 4.0 기반 실시간 한옥 공공건축물, 궁궐, 고택, 서원, 한옥마을 정보를 제공하는 디지털 한옥도감입니다.',
  openGraph: {
    title: '한옥도감 — 온마루',
    description: '전국 한옥 & 문화유산을 기록하다',
    type: 'website',
  },
};

export default function HanokPage() {
  const { villages, meta } = HANOK_ARCHIVE_FALLBACK;

  return <HanokArchive villages={villages} meta={meta} />;
}
