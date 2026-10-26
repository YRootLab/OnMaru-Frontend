import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import type { LiveList } from '@liveblocks/client';

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? '',
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
