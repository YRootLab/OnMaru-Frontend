'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { MapCollabProvider } from '@/features/map/collaboration/MapCollabProvider';

const MapPage = dynamic(() => import('@/features/map/MapPage'), { ssr: false });

// NEXT_PUBLIC_LIVEBLOCKS_ENABLED=true 일 때만 협업 모드 활성화
const COLLAB_ENABLED = process.env.NEXT_PUBLIC_LIVEBLOCKS_ENABLED === 'true';

function MapPageWrapper() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room');

  if (room && COLLAB_ENABLED) {
    return (
      <MapCollabProvider roomId={room}>
        <MapPage />
      </MapCollabProvider>
    );
  }

  return <MapPage />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MapPageWrapper />
    </Suspense>
  );
}
