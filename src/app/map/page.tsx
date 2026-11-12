'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MapCollabProvider } from '@/features/map/collaboration/MapCollabProvider';
import { mapCollabApi } from '@/features/map/collaboration/api';

const MapPage = dynamic(() => import('@/features/map/MapPage'), { ssr: false });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function MapPageWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawRoom = searchParams.get('room');
  const room = rawRoom && UUID_RE.test(rawRoom) ? rawRoom : null;
  const invite = searchParams.get('invite');

  const [joining, setJoining] = useState(!!invite);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(room);

  // invite 토큰이 있으면 join API 호출 → roomId로 교체
  useEffect(() => {
    if (!invite) return;

    mapCollabApi.joinRoom(invite)
      .then((res) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('invite');
        params.set('room', res.room.id);
        router.replace(`/map?${params.toString()}`);
        setResolvedRoomId(res.room.id);
        if (!res.alreadyMember) {
          toast.info('공유 지도에 참여했어요', {
            description: '이 링크는 72시간 동안 유지돼요.',
            duration: 4000,
          });
        }
      })
      .catch((err) => {
        const code = (err as { code?: string })?.code;
        if (code === 'INVITE_NOT_FOUND') {
          toast.error('초대 링크가 만료됐거나 유효하지 않아요.');
        } else if (code === 'ROOM_FULL') {
          toast.error('방 인원이 가득 찼어요. (최대 20명)');
        } else {
          toast.error('지도 참여에 실패했어요.');
        }
        router.replace('/map');
      })
      .finally(() => setJoining(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite]);

  if (joining) return null;

  if (resolvedRoomId) {
    return (
      <MapCollabProvider roomId={resolvedRoomId}>
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
