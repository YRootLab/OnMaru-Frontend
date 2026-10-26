import type { LiveList } from '@liveblocks/client';

export type CollabPin = {
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  userId: string;
};

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { lat: number; lng: number } | null;
      userId: string;
      nickname: string;
      profileImage: string | null;
    };
    Storage: {
      pins: LiveList<CollabPin>;
    };
  }
}

export {};
