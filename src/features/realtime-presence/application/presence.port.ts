import type { ClientId, PresenceSnapshot, RoomId, WarmthEvent, WarmthType } from '../domain/presence.types';

// Transport 레이어가 훅에게 알려주는 원시 연결 이벤트
export type TransportConnectionEvent = 'open' | 'closed';

// 6.4 API 계약을 기반으로 한 Transport 포트.
// Mock → Spring SSE → Redis 기반 서버로 교체 시 이 인터페이스만 구현하면 된다.
export interface IPresenceTransport {
  connect(roomId: RoomId, clientId: ClientId): void;
  close(): void;
  sendWarmth(payload: { roomId: RoomId; type: WarmthType; x: number }): void;
  onSnapshot(handler: (snapshot: PresenceSnapshot) => void): () => void;
  onWarmth(handler: (event: WarmthEvent) => void): () => void;
  // 스펙 4절 메서드 목록에는 없으나 상태 머신 구동을 위해 필요
  onConnectionChange(handler: (event: TransportConnectionEvent) => void): () => void;
}
