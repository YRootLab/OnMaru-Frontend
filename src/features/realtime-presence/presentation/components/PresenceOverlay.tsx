'use client';

import dynamic from 'next/dynamic';

const PresenceDevCore = dynamic(() => import('./PresenceDevCore'), { ssr: false });

export function PresenceOverlay({ roomId }: { roomId: string }) {
  return <PresenceDevCore roomId={roomId} />;
}
