import type { Metadata } from 'next';
import KCultureDiscovery from '@/features/k-culture-discovery/KCultureDiscovery';
import type { TopicCode } from '@/features/k-culture-discovery/domain/types';

export const metadata: Metadata = {
  title: '탐색마루 — K-Culture 장소 탐색 | 온마루',
  description:
    '전통 공간·문화유산부터 드라마·영화·MV 촬영지까지, 근거가 확인된 K-Culture 장소를 탐색하세요.',
  openGraph: {
    title: '탐색마루 — 온마루',
    description: 'K-Culture 장소를 탐색하다',
    type: 'website',
  },
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const topic = typeof params.topic === 'string' ? (params.topic as TopicCode | 'all') : 'all';
  const workId = typeof params.workId === 'string' ? params.workId : undefined;

  return <KCultureDiscovery initialTopic={topic} workId={workId} />;
}
