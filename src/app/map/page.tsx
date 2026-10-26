'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { MapCollabProvider } from '@/features/map/collaboration/MapCollabProvider';

const MapPage = dynamic(() => import('@/features/map/MapPage'), { ssr: false });

function MapPageWrapper() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room');

  if (room) {
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
