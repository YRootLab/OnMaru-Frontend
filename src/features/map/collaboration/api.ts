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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function enc(segment: string): string {
  return encodeURIComponent(segment);
}

function assertUuid(value: string, label: string): void {
  if (!UUID_RE.test(value)) throw new Error(`Invalid ${label}: ${value}`);
}

export const mapCollabApi = {
  createRoom(): Promise<CreateRoomResponse> {
    return apiRequest(`/${BASE}`, { method: 'POST', csrf: true });
  },

  joinRoom(token: string): Promise<JoinRoomResponse> {
    return apiRequest(`/${BASE}/joins`, { method: 'POST', csrf: true, body: { token } });
  },

  getRoom(roomId: string): Promise<RoomDetailResponse> {
    assertUuid(roomId, 'roomId');
    return apiRequest(`/${BASE}/${enc(roomId)}`);
  },

  getSnapshot(roomId: string): Promise<SnapshotResponse> {
    assertUuid(roomId, 'roomId');
    return apiRequest(`/${BASE}/${enc(roomId)}/snapshot`);
  },

  getMyRooms() {
    return apiRequest<{ schemaVersion: string; rooms: Array<{ id: string; status: string; expiresAt: string; role: string; joinedAt: string }> }>(`/${BASE}/mine`);
  },

  createInvite(roomId: string): Promise<InviteResponse> {
    assertUuid(roomId, 'roomId');
    return apiRequest(`/${BASE}/${enc(roomId)}/invites`, { method: 'POST', csrf: true });
  },

  deleteInvite(roomId: string, inviteId: string): Promise<void> {
    assertUuid(roomId, 'roomId');
    assertUuid(inviteId, 'inviteId');
    return apiRequest(`/${BASE}/${enc(roomId)}/invites/${enc(inviteId)}`, { method: 'DELETE', csrf: true });
  },

  addPin(roomId: string, placeId: string, opId: string): Promise<PinAddResponse> {
    assertUuid(roomId, 'roomId');
    assertUuid(opId, 'opId');
    return apiRequest(`/${BASE}/${enc(roomId)}/pins`, { method: 'POST', csrf: true, body: { opId, placeId } });
  },

  removePin(roomId: string, pinId: string, opId: string): Promise<PinRemoveResponse> {
    assertUuid(roomId, 'roomId');
    assertUuid(pinId, 'pinId');
    assertUuid(opId, 'opId');
    const qs = new URLSearchParams({ opId }).toString();
    return apiRequest(`/${BASE}/${enc(roomId)}/pins/${enc(pinId)}?${qs}`, { method: 'DELETE', csrf: true });
  },
};

/** REST base URL → wss URL for WebSocket connection */
export function buildWsUrl(roomId: string, lastSeq?: number): string {
  assertUuid(roomId, 'roomId');
  const apiBase =
    (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL_INTERNAL : undefined) ||
    'https://api.onmaru.site';
  const wsBase = apiBase.replace(/^https?:\/\//, 'wss://').replace(/\/+$/, '');
  const url = `${wsBase}/api/v1/map-rooms/${enc(roomId)}/ws`;
  if (lastSeq !== undefined) {
    const qs = new URLSearchParams({ lastSeq: String(lastSeq) }).toString();
    return `${url}?${qs}`;
  }
  return url;
}
