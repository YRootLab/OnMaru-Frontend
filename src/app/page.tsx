'use client';

import React from 'react';
import useOneLongScroll from '@/features/one-long-scroll/hooks/useOneLongScroll';
import FixedBackgroundCanvas from '@/features/one-long-scroll/components/FixedBackgroundCanvas';
import ScrollTrack from '@/features/one-long-scroll/components/ScrollTrack';
import ProgressOverlay from '@/features/one-long-scroll/components/ProgressOverlay';

export default function Home() {
  useOneLongScroll();

  return (
    <main style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <FixedBackgroundCanvas />
      <ScrollTrack panels={5} />
      <ProgressOverlay />
    </main>
  );
}
