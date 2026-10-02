import type { IPresenceTransport, TransportConnectionEvent } from '../application/presence.port';
import type {
  ClientId,
  PresenceSnapshot,
  RoomId,
  WarmthEvent,
  WarmthType,
} from '../domain/presence.types';

export interface MockPresenceTransportOptions {
  initialCount?: number;
  // 가상 접속자 수 자동 변화 주기 (ms). 0이면 비활성
  countChangeIntervalMs?: number;
  // connect() 호출 후 open 이벤트까지 지연 (ms)
  connectDelayMs?: number;
}

export interface MockPresenceTransportScenarios {
  /** 연결 강제 종료. 훅의 재연결 로직 테스트에 사용 */
  simulateDisconnect(): void;
  /** 접속자 수 직접 설정 후 snapshot 방출 */
  setActiveCount(count: number): void;
  /** 반응 폭주 시나리오: count개의 warmth 이벤트를 즉시 방출 */
  simulateWarmthFlood(count: number, type?: WarmthType): void;
  /** 서버 장애 시나리오: 연결 불가 상태로 전환 (이후 connect() 거부) */
  simulateServerError(): void;
  /** 장애 해제: simulateServerError 이후 다시 연결 가능 상태로 복원 */
  restoreServer(): void;
  /** 타이머·구독 정리. 테스트 teardown에서 호출 */
  destroy(): void;
}

export function createMockPresenceTransport(
  opts: MockPresenceTransportOptions = {},
): IPresenceTransport & MockPresenceTransportScenarios {
  const connectDelayMs = opts.connectDelayMs ?? 50;
  const countChangeIntervalMs = opts.countChangeIntervalMs ?? 3_000;

  let activeCount = opts.initialCount ?? Math.floor(Math.random() * 5) + 1;
  let todayVisitors = Math.floor(Math.random() * 200) + 10;
  let connectedRoom: RoomId | null = null;
  let connectedClient: ClientId | null = null;
  let isConnected = false;
  let serverDown = false;

  const snapshotHandlers = new Set<(s: PresenceSnapshot) => void>();
  const warmthHandlers = new Set<(e: WarmthEvent) => void>();
  const connHandlers = new Set<(e: TransportConnectionEvent) => void>();

  let countTimer: ReturnType<typeof setInterval> | null = null;

  function snapshot(): PresenceSnapshot {
    return {
      roomId: connectedRoom ?? '',
      activeCount,
      todayVisitors,
      serverTime: Math.floor(Date.now() / 1000),
    };
  }

  function emitConn(e: TransportConnectionEvent) {
    connHandlers.forEach((h) => h(e));
  }

  function emitSnapshot(s: PresenceSnapshot) {
    snapshotHandlers.forEach((h) => h(s));
  }

  function emitWarmth(e: WarmthEvent) {
    warmthHandlers.forEach((h) => h(e));
  }

  function startCountChanges() {
    if (countChangeIntervalMs <= 0) return;
    countTimer = setInterval(() => {
      if (!isConnected) return;
      activeCount = Math.max(1, activeCount + (Math.random() > 0.5 ? 1 : -1));
      emitSnapshot(snapshot());
    }, countChangeIntervalMs);
  }

  function stopCountChanges() {
    if (countTimer) {
      clearInterval(countTimer);
      countTimer = null;
    }
  }

  return {
    // ── IPresenceTransport ──────────────────────────────────────────────────

    connect(roomId, clientId) {
      if (serverDown) return;
      connectedRoom = roomId;
      connectedClient = clientId;
      isConnected = true;
      setTimeout(() => {
        if (!isConnected || serverDown) return;
        emitConn('open');
        emitSnapshot(snapshot());
        startCountChanges();
      }, connectDelayMs);
    },

    close() {
      isConnected = false;
      stopCountChanges();
      emitConn('closed');
    },

    sendWarmth(payload) {
      if (!isConnected) return;
      // 다른 사용자가 반응한 것처럼 30~100ms 후 방출
      setTimeout(
        () => {
          if (!isConnected) return;
          emitWarmth({
            type: payload.type,
            x: payload.x,
            ts: Math.floor(Date.now() / 1000),
          });
        },
        30 + Math.random() * 70,
      );
    },

    onSnapshot(handler) {
      snapshotHandlers.add(handler);
      return () => snapshotHandlers.delete(handler);
    },

    onWarmth(handler) {
      warmthHandlers.add(handler);
      return () => warmthHandlers.delete(handler);
    },

    onConnectionChange(handler) {
      connHandlers.add(handler);
      return () => connHandlers.delete(handler);
    },

    // ── 시나리오 주입 API ───────────────────────────────────────────────────

    simulateDisconnect() {
      isConnected = false;
      stopCountChanges();
      emitConn('closed');
    },

    setActiveCount(count) {
      activeCount = count;
      if (isConnected) emitSnapshot(snapshot());
    },

    simulateWarmthFlood(count, type = 'firefly') {
      for (let i = 0; i < count; i++) {
        emitWarmth({ type, x: Math.random(), ts: Math.floor(Date.now() / 1000) });
      }
    },

    simulateServerError() {
      serverDown = true;
      isConnected = false;
      stopCountChanges();
      emitConn('closed');
    },

    restoreServer() {
      serverDown = false;
    },

    destroy() {
      stopCountChanges();
      snapshotHandlers.clear();
      warmthHandlers.clear();
      connHandlers.clear();
      isConnected = false;
    },
  };
}
