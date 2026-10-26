'use client';

import { useRef, type ReactNode } from 'react';
import { LiveList } from '@liveblocks/client';
import { RoomProvider } from './liveblocks.config';
import { useAuth } from '@/features/auth';

interface Props {
  roomId: string;
  children: ReactNode;
}

export function MapCollabProvider({ roomId, children }: Props) {
  const { user } = useAuth();
  // Anonymous per-session ID — never expose the real account ID over the wire
  const sessionIdRef = useRef(crypto.randomUUID());

  return (
    <RoomProvider
      id={`map-collab-${roomId}`}
      initialPresence={{
        cursor: null,
        userId: sessionIdRef.current,
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
