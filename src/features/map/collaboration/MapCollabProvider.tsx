'use client';

import { Component, createContext, useContext, useRef, type ReactNode } from 'react';
import { LiveList } from '@liveblocks/client';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';
import { useAuth } from '@/features/auth';

async function liveblocksAuthEndpoint(roomId?: string): Promise<{ token: string }> {
  const room = (roomId ?? '').replace(/^map-collab-/, '');
  const res = await fetch('/api/liveblocks-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Liveblocks auth failed: ${res.status}`);
  return res.json();
}

// true = inside a live RoomProvider; false = error fallback path (no RoomProvider)
export const CollabActiveContext = createContext(false);
export const useCollabActive = () => useContext(CollabActiveContext);

// Liveblocks auth 실패 시 맵 자체는 정상 렌더되도록 에러 경계
class CollabErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface Props {
  roomId: string;
  children: ReactNode;
}

export function MapCollabProvider({ roomId, children }: Props) {
  const { user } = useAuth();
  // Anonymous per-session ID — never expose the real account ID over the wire
  const sessionIdRef = useRef(crypto.randomUUID());

  return (
    <CollabErrorBoundary fallback={children}>
      <LiveblocksProvider authEndpoint={liveblocksAuthEndpoint}>
      <CollabActiveContext.Provider value={true}>
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
      </CollabActiveContext.Provider>
      </LiveblocksProvider>
    </CollabErrorBoundary>
  );
}
