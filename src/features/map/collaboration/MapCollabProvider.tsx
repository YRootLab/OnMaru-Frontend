'use client';

import { Component, createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { LiveList } from '@liveblocks/client';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';
import { toast } from 'sonner';
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

// 공유 링크로 입장 시 1회 안내 toast (같은 방·같은 세션은 재표시 안 함)
function RoomJoinNotice({ roomId }: { roomId: string }) {
  useEffect(() => {
    const key = `collab_joined_${roomId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage 불가 시 매번 표시 */ }
    toast.info('공유 지도에 참여했어요', {
      description: '이 링크는 72시간 동안 유지돼요.',
      duration: 4000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

interface Props {
  roomId: string;
  children: ReactNode;
}

export function MapCollabProvider({ roomId, children }: Props) {
  const { user, isLoggedIn } = useAuth();
  // Anonymous per-session ID — never expose the real account ID over the wire
  const sessionIdRef = useRef(crypto.randomUUID());

  // 비로그인 상태에서 Liveblocks auth 무한 재시도 방지
  if (!isLoggedIn) return <>{children}</>;

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
          <RoomJoinNotice roomId={roomId} />
          {children}
        </RoomProvider>
      </CollabActiveContext.Provider>
      </LiveblocksProvider>
    </CollabErrorBoundary>
  );
}
