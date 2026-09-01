import type { Metadata } from 'next';
import HanokArchive from '@/hanok/HanokArchive';
import type { Village, VillageMeta } from '@/hanok/types';
import { HanokArchiveService } from '@/hanok/services/hanokArchive.service';

async function getVillageData(): Promise<{ villages: Village[]; meta: VillageMeta }> {
  // TourAPI 4.0 실시간 라이브 API 호출
  return await HanokArchiveService.fetchRealtimeHanoks();
}

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

export default async function HanokPage() {
  const { villages, meta } = await getVillageData();

  return <HanokArchive villages={villages} meta={meta} />;
}
