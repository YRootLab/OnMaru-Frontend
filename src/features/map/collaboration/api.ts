import { apiRequest } from '@/lib/api/client';
import type {
  CreateRoomResponse,
  InviteResponse,
  JoinRoomResponse,
  PinAddResponse,
  PinRemoveResponse,
  RoomDetailResponse,
  SnapshotResponse,
} from './types';

const BASE = 'map-rooms';

export const mapCollabApi = {
  createRoom(): Promise<CreateRoomResponse> {
    return apiRequest(`/${BASE}`, { method: 'POST', csrf: true });
  },

  joinRoom(token: string): Promise<JoinRoomResponse> {
    return apiRequest(`/${BASE}/joins`, { method: 'POST', csrf: true, body: { token } });
  },

  getRoom(roomId: string): Promise<RoomDetailResponse> {
    return apiRequest(`/${BASE}/${roomId}`);
  },

  getSnapshot(roomId: string): Promise<SnapshotResponse> {
    return apiRequest(`/${BASE}/${roomId}/snapshot`);
  },

  getMyRooms() {
    return apiRequest<{ schemaVersion: string; rooms: Array<{ id: string; status: string; expiresAt: string; role: string; joinedAt: string }> }>(`/${BASE}/mine`);
  },

  createInvite(roomId: string): Promise<InviteResponse> {
    return apiRequest(`/${BASE}/${roomId}/invites`, { method: 'POST', csrf: true });
  },

  deleteInvite(roomId: string, inviteId: string): Promise<void> {
    return apiRequest(`/${BASE}/${roomId}/invites/${inviteId}`, { method: 'DELETE', csrf: true });
  },

  addPin(roomId: string, placeId: string, opId: string): Promise<PinAddResponse> {
    return apiRequest(`/${BASE}/${roomId}/pins`, { method: 'POST', csrf: true, body: { opId, placeId } });
  },

  removePin(roomId: string, pinId: string, opId: string): Promise<PinRemoveResponse> {
    return apiRequest(`/${BASE}/${roomId}/pins/${pinId}?opId=${opId}`, { method: 'DELETE', csrf: true });
  },
};

/** REST base URL → wss URL for WebSocket connection */
export function buildWsUrl(roomId: string, lastSeq?: number): string {
  const apiBase =
    (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL_INTERNAL : undefined) ||
    'https://api.onmaru.site';
  const wsBase = apiBase.replace(/^https?:\/\//, 'wss://').replace(/\/+$/, '');
  const url = `${wsBase}/api/v1/map-rooms/${roomId}/ws`;
  return lastSeq !== undefined ? `${url}?lastSeq=${lastSeq}` : url;
}
