import type { Metadata } from 'next';
import HanokArchive from '@/features/hanok-archive/HanokArchive';
import { HANOK_ARCHIVE_FALLBACK } from '@/features/hanok-archive/data/hanokArchiveFallback';
import { readFilterState } from '@/features/hanok-archive/sections/hanokFilterQuery';

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









export default async function HanokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { villages, meta } = HANOK_ARCHIVE_FALLBACK;
  const params = await searchParams;

  const search = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => {
      if (value === undefined) return [];
      return Array.isArray(value)
        ? value.map((one): [string, string] => [key, one])
        : [[key, value] as [string, string]];
    }),
  ).toString();

  return (
    <HanokArchive villages={villages} meta={meta} initialFilters={readFilterState(search)} />
  );
}
