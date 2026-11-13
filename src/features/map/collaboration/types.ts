export type RoomRole = 'OWNER' | 'MEMBER';
export type RoomStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED';

export interface RoomInfo {
  id: string;
  status: RoomStatus;
  expiresAt: string;
  role?: RoomRole;
}

export interface Member {
  memberId: string;
  displayName: string;
  role: RoomRole;
  joinedAt: string;
  online: boolean;
}

export interface CollabPin {
  pinId: string;
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  addedBy: string;
  addedAt: string;
  order: number;
}

export interface CursorState {
  memberId: string;
  displayName: string;
  lat: number | null;
  lng: number | null;
}

// REST API response types
export interface CreateRoomResponse {
  schemaVersion: string;
  room: RoomInfo & { role: RoomRole };
  invite: { token: string; shareUrl: string; expiresAt: string };
}

export interface JoinRoomResponse {
  schemaVersion: string;
  room: RoomInfo;
  role: RoomRole;
  alreadyMember: boolean;
}

export interface RoomDetailResponse {
  schemaVersion: string;
  room: RoomInfo & { role: RoomRole };
  members: Member[];
}

export interface SnapshotResponse {
  schemaVersion: string;
  lastSeq: number;
  pins: CollabPin[];
}

export interface InviteResponse {
  schemaVersion: string;
  invite: { token: string; shareUrl: string; expiresAt: string };
}

export interface PinAddResponse {
  schemaVersion: string;
  seq: number;
  pin: CollabPin;
}

export interface PinRemoveResponse {
  schemaVersion: string;
  seq: number;
  pinId: string;
}

// WebSocket message types
export type WsClientMsgType = 'PIN_ADD' | 'PIN_REMOVE' | 'CURSOR' | 'RESUME';
export type WsServerMsgType =
  | 'WELCOME'
  | 'ACK'
  | 'EVENT'
  | 'ERROR'
  | 'CURSORS'
  | 'PRESENCE'
  | 'RESYNC_REQUIRED';
export type WsEventType = 'PIN_ADDED' | 'PIN_REMOVED' | 'MEMBER_JOINED' | 'ROOM_CLOSED';

export interface WsActor {
  memberId: string;
  displayName: string;
}

export interface WsWelcomePayload {
  me: WsActor;
  room: RoomInfo;
  members: WsActor[];
  pins: CollabPin[];
  lastSeq: number;
}

export interface WsAckPayload {
  seq: number;
  pin?: CollabPin;
  pinId?: string;
}

export interface WsEventPayload {
  seq: number;
  eventType: WsEventType;
  actor?: WsActor;
  pin?: CollabPin;
  pinId?: string;
}

export interface WsErrorPayload {
  code: string;
  message: string;
  existingPin?: { pinId: string; placeId: string };
}

export interface WsCursorsPayload {
  cursors: CursorState[];
}

export interface WsPresencePayload {
  memberId: string;
  online: boolean;
}

export interface WsResyncPayload {
  reason: 'GAP';
}

export type WsServerMessage =
  | { v: 1; type: 'WELCOME'; payload: WsWelcomePayload }
  | { v: 1; type: 'ACK'; opId: string; payload: WsAckPayload }
  | { v: 1; type: 'EVENT'; payload: WsEventPayload }
  | { v: 1; type: 'ERROR'; opId?: string; payload: WsErrorPayload }
  | { v: 1; type: 'CURSORS'; payload: WsCursorsPayload }
  | { v: 1; type: 'PRESENCE'; payload: WsPresencePayload }
  | { v: 1; type: 'RESYNC_REQUIRED'; payload: WsResyncPayload };

// Context shape
export interface CollabContextValue {
  roomId: string;
  room: RoomInfo | null;
  myMemberId: string | null;
  myDisplayName: string | null;
  members: Member[];
  pins: CollabPin[];
  cursors: CursorState[];
  wsStatus: 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';
  addPin: (placeId: string) => void;
  removePin: (pinId: string) => void;
  sendCursor: (lat: number | null, lng: number | null) => void;
  createInvite: () => Promise<{ shareUrl: string }>;
}
