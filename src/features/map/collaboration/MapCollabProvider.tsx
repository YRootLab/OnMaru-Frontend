'use client';

import { type ReactNode } from 'react';
import { LiveList } from '@liveblocks/client';
import { RoomProvider } from './liveblocks.config';
import { useAuth } from '@/features/auth';

interface Props {
  roomId: string;
  children: ReactNode;
}

export function MapCollabProvider({ roomId, children }: Props) {
  const { user } = useAuth();

  return (
    <RoomProvider
      id={`map-collab-${roomId}`}
      initialPresence={{
        cursor: null,
        userId: user?.id ?? 'guest',
        nickname: user?.displayName ?? '게스트',
        profileImage: null,
      }}
      initialStorage={{
        pins: new LiveList([]),
      }}
    >
      {children}
    </RoomProvider>
  );
}
