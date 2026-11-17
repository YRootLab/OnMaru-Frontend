import type { Metadata } from 'next';
import WorkDetailView from '@/features/k-culture-discovery/presentation/components/WorkDetailView';

export const metadata: Metadata = {
  title: '작품 상세 — 탐색마루 | 온마루',
};

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const { workId } = await params;
  return <WorkDetailView workId={decodeURIComponent(workId)} backHref="/discover/works" />;
}
