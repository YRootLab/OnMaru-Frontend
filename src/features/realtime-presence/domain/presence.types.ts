export type RoomId = string;
export type ClientId = string;

// 6.4 구독 스트림 event: snapshot
export interface PresenceSnapshot {
  roomId: RoomId;
  activeCount: number;
  todayVisitors: number;
  serverTime: number; // Unix 초
}

// 6.4 구독 스트림 event: warmth
export type WarmthType = string; // "firefly" 등; 알 수 없는 타입은 서버가 400 반환

export interface WarmthEvent {
  type: WarmthType;
  x: number;  // 0–1, 화면 상 가로 위치 비율
  ts: number; // Unix 초
}

// 4.2 연결 상태 머신
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'degraded';
