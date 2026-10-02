import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  MAX_RECONNECT_ATTEMPTS,
  TAB_HIDDEN_DISCONNECT_MS,
  canSendWarmth,
  isTabVisible,
  nextBackoffMs,
} from '../domain/presence.policy';
import type {
  ConnectionState,
  PresenceSnapshot,
  RoomId,
  WarmthType,
} from '../domain/presence.types';
import type { IPresenceTransport } from './presence.port';

export interface PresenceRoomState {
  connection: ConnectionState;
  snapshot: PresenceSnapshot | null;
  reconnectAttempts: number;
}

export type PresenceRoomAction =
  | { type: 'CONNECT' }
  | { type: 'TRANSPORT_OPEN' }
  | { type: 'TRANSPORT_CLOSE' }
  | { type: 'DEGRADE' }
  | { type: 'CLOSE' }
  | { type: 'UPDATE_SNAPSHOT'; payload: PresenceSnapshot }
  // 가시성 관련 액션: attempts 카운터에 영향 없음
  | { type: 'VISIBILITY_PAUSE' }     // hidden 30초 → 재연결 없이 대기
  | { type: 'VISIBILITY_RECONNECT' }; // visible 복귀 → attempts 0 리셋 + 즉시 연결

const initialState: PresenceRoomState = {
  connection: 'idle',
  snapshot: null,
  reconnectAttempts: 0,
};

export function presenceRoomReducer(
  state: PresenceRoomState,
  action: PresenceRoomAction,
): PresenceRoomState {
  switch (action.type) {
    case 'CONNECT':
      if (state.connection === 'closed' || state.connection === 'degraded') return state;
      return { ...state, connection: 'connecting' };

    case 'TRANSPORT_OPEN':
      return { ...state, connection: 'open', reconnectAttempts: 0 };

    case 'TRANSPORT_CLOSE': {
      if (state.connection === 'closed' || state.connection === 'degraded') return state;
      const attempts = state.reconnectAttempts + 1;
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        return { ...state, connection: 'degraded', reconnectAttempts: attempts };
      }
      return { ...state, connection: 'reconnecting', reconnectAttempts: attempts };
    }

    case 'DEGRADE':
      return { ...state, connection: 'degraded' };

    case 'CLOSE':
      return { ...state, connection: 'closed' };

    case 'UPDATE_SNAPSHOT':
      return { ...state, snapshot: action.payload };

    case 'VISIBILITY_PAUSE':
      // attempts 증가 없이 reconnecting 상태로 전이 (5회 규칙 영향 없음)
      if (state.connection === 'closed' || state.connection === 'degraded') return state;
      return { ...state, connection: 'reconnecting' };

    case 'VISIBILITY_RECONNECT':
      // visible 복귀: attempts 0 리셋 + connecting 전이
      if (state.connection !== 'reconnecting') return state;
      return { ...state, connection: 'connecting', reconnectAttempts: 0 };

    default:
      return state;
  }
}

function getOrCreateClientId(): string {
  try {
    const key = 'omrp_cid';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `c_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    // 프라이빗 모드 등 sessionStorage 접근 불가 시 임시 ID
    return `c_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// 요건 1: 백오프 시작 조건 순수 함수 (reconnecting + visible 일 때만)
export function canStartReconnectBackoff(
  connectionState: ConnectionState,
  visibilityState: DocumentVisibilityState,
): boolean {
  return connectionState === 'reconnecting' && isTabVisible(visibilityState);
}

// 테스트 가능한 숨김 타이머 팩토리 (visibilitychange hidden → 30s 후 disconnect)
export function createHiddenTimer(
  onTimeout: () => void,
  timeoutMs: number = TAB_HIDDEN_DISCONNECT_MS,
): { start(): void; cancel(): void } {
  let id: ReturnType<typeof setTimeout> | null = null;
  return {
    start() {
      if (id !== null) clearTimeout(id); // 중복 start 시 리셋
      id = setTimeout(onTimeout, timeoutMs);
    },
    cancel() {
      if (id !== null) { clearTimeout(id); id = null; }
    },
  };
}

export interface UsePresenceRoomResult {
  connection: ConnectionState;
  snapshot: PresenceSnapshot | null;
  sendWarmth(type: WarmthType, x: number): void;
}

export function usePresenceRoom(
  roomId: RoomId,
  transport: IPresenceTransport,
): UsePresenceRoomResult {
  const [state, dispatch] = useReducer(presenceRoomReducer, initialState);
  const clientIdRef = useRef<string | null>(null);
  const lastSentAtRef = useRef(0);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  const connectionRef = useRef(state.connection);
  connectionRef.current = state.connection;

  useEffect(() => {
    clientIdRef.current ??= getOrCreateClientId();
    dispatch({ type: 'CONNECT' });
    transport.connect(roomId, clientIdRef.current);

    const unsubConn = transport.onConnectionChange((raw) => {
      dispatch({ type: raw === 'open' ? 'TRANSPORT_OPEN' : 'TRANSPORT_CLOSE' });
    });
    const unsubSnap = transport.onSnapshot((snap) => {
      dispatch({ type: 'UPDATE_SNAPSHOT', payload: snap });
    });

    return () => {
      unsubConn();
      unsubSnap();
      dispatch({ type: 'CLOSE' });
      transport.close();
    };
  }, [roomId, transport]);

  // 재연결 백오프: reconnecting + visible 일 때만 타이머 스케줄
  // hidden 중에는 시작하지 않음 (visible 복귀 시 VISIBILITY_RECONNECT로 즉시 재연결)
  useEffect(() => {
    if (state.connection !== 'reconnecting') return;
    const visibility = typeof document !== 'undefined' ? document.visibilityState : 'visible';
    if (!isTabVisible(visibility)) return;
    const delay = nextBackoffMs(state.reconnectAttempts - 1);
    const t = setTimeout(() => {
      clientIdRef.current ??= getOrCreateClientId();
      dispatch({ type: 'CONNECT' });
      transport.connect(roomIdRef.current, clientIdRef.current);
    }, delay);
    return () => clearTimeout(t);
  }, [state.connection, state.reconnectAttempts, transport]);

  // 7.3 탭 가시성 처리: hidden → 30초 후 연결 종료, visible → 즉시 재연결
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const hiddenTimer = createHiddenTimer(() => {
      // open 상태에서 30초 경과 → VISIBILITY_PAUSE (attempts 증가 없음)
      transport.close();
      dispatch({ type: 'VISIBILITY_PAUSE' });
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // open 상태일 때만 타이머 시작 (이미 reconnecting/degraded면 무시)
        if (connectionRef.current === 'open') hiddenTimer.start();
      } else {
        hiddenTimer.cancel();
        // reconnecting 상태면 VISIBILITY_RECONNECT: attempts 0 + 즉시 재연결
        if (connectionRef.current === 'reconnecting') {
          clientIdRef.current ??= getOrCreateClientId();
          dispatch({ type: 'VISIBILITY_RECONNECT' });
          transport.connect(roomIdRef.current, clientIdRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      hiddenTimer.cancel();
    };
  }, [transport]);

  const sendWarmth = useCallback(
    (type: WarmthType, x: number) => {
      const now = Date.now();
      if (!canSendWarmth(lastSentAtRef.current, now)) return;
      lastSentAtRef.current = now;
      transport.sendWarmth({ roomId: roomIdRef.current, type, x });
    },
    [transport],
  );

  return { connection: state.connection, snapshot: state.snapshot, sendWarmth };
}
