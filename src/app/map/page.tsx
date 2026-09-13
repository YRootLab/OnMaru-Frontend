'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MapPage = dynamic(() => import('@/features/map/MapPage'), { ssr: false });


export default function Page() {
  return (
    <Suspense fallback={null}>
      <MapPage />
    </Suspense>
  );
}
