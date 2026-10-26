import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import type { LiveList } from '@liveblocks/client';

export const client = createClient({
  authEndpoint: async (roomId) => {
    // roomId = "map-collab-<uuid>", 뒤의 UUID만 추출해서 서버에 전송
    const room = (roomId ?? '').replace(/^map-collab-/, '');
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Liveblocks auth failed: ${res.status}`);
    return res.json();
  },
});

export type CollabPin = {
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  userId: string;
};

export type Presence = {
  cursor: { lat: number; lng: number } | null;
  userId: string;
  nickname: string;
  profileImage: string | null;
};

export type Storage = {
  pins: LiveList<CollabPin>;
};

export const {
  RoomProvider,
  useOthers,
  useMyPresence,
  useStorage,
  useMutation,
  useSelf,
} = createRoomContext<Presence, Storage>(client);
