import type { Metadata } from 'next';
import HanokArchive from '@/hanok/HanokArchive';
import { HANOK_ARCHIVE_FALLBACK } from '@/hanok/data/hanokArchiveFallback';
import { readFilterState } from '@/hanok/sections/hanokFilterQuery';

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

/*
  걸러진 도감을 링크로 주고받을 수 있어야 한다.

  주소창을 브라우저에서 읽어 effect로 밀어넣으면, 서버가 그린 첫 화면은 늘 필터가 없는
  상태다 — 공유받은 링크를 열면 전체 목록이 한 번 번쩍인 뒤 걸러진다. 여기서 읽어
  내려보내면 서버가 처음부터 걸러진 상태로 그리고, 물려받은 클라이언트도 같은 값에서
  시작하므로 어긋날 자리가 없다.
*/
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
