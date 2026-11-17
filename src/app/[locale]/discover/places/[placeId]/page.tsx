import type { Metadata } from 'next';
import PlaceDetailView from '@/features/k-culture-discovery/presentation/components/PlaceDetailView';

export const metadata: Metadata = {
  title: '장소 상세 — 탐색마루 | 온마루',
};

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  return <PlaceDetailView placeId={decodeURIComponent(placeId)} backHref="/discover" />;
}
