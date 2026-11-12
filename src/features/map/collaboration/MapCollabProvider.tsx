'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { mapCollabApi, buildWsUrl } from './api';
import type {
  CollabContextValue,
  CollabPin,
  CursorState,
  Member,
  RoomInfo,
  WsServerMessage,
} from './types';

// ─── State & Reducer ────────────────────────────────────────────────────────

interface CollabState {
  room: RoomInfo | null;
  myMemberId: string | null;
  myDisplayName: string | null;
  members: Member[];
  pins: CollabPin[];
  cursors: CursorState[];
  lastSeq: number;
  wsStatus: 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';
}

const INITIAL_STATE: CollabState = {
  room: null,
  myMemberId: null,
  myDisplayName: null,
  members: [],
  pins: [],
  cursors: [],
  lastSeq: -1,
  wsStatus: 'connecting',
};

type Action =
  | { type: 'WELCOME'; payload: { room: RoomInfo; myMemberId: string; myDisplayName: string; members: { memberId: string; displayName: string }[]; pins: CollabPin[]; lastSeq: number } }
  | { type: 'SNAPSHOT'; payload: { pins: CollabPin[]; lastSeq: number; room: RoomInfo; members: Member[] } }
  | { type: 'PIN_ADDED'; seq: number; pin: CollabPin }
  | { type: 'PIN_REMOVED'; seq: number; pinId: string }
  | { type: 'MEMBER_JOINED'; seq: number; memberId: string; displayName: string }
  | { type: 'CURSORS'; cursors: CursorState[] }
  | { type: 'PRESENCE'; memberId: string; online: boolean }
  | { type: 'WS_STATUS'; status: CollabState['wsStatus'] };

function reducer(state: CollabState, action: Action): CollabState {
  switch (action.type) {
    case 'WELCOME': {
      const members: Member[] = action.payload.members.map((m) => ({
        ...m,
        role: 'MEMBER' as const,
        joinedAt: '',
        online: true,
      }));
      return {
        ...state,
        room: action.payload.room,
        myMemberId: action.payload.myMemberId,
        myDisplayName: action.payload.myDisplayName,
        members,
        pins: [...action.payload.pins].sort((a, b) => a.order - b.order),
        lastSeq: action.payload.lastSeq,
        wsStatus: 'connected',
      };
    }
    case 'SNAPSHOT':
      return {
        ...state,
        room: action.payload.room,
        members: action.payload.members,
        pins: [...action.payload.pins].sort((a, b) => a.order - b.order),
        lastSeq: action.payload.lastSeq,
        wsStatus: 'connected',
      };
    case 'PIN_ADDED': {
      if (action.seq <= state.lastSeq) return state; // 중복 적용 방지
      if (state.pins.some((p) => p.pinId === action.pin.pinId)) return { ...state, lastSeq: action.seq };
      return {
        ...state,
        pins: [...state.pins, action.pin].sort((a, b) => a.order - b.order),
        lastSeq: action.seq,
      };
    }
    case 'PIN_REMOVED': {
      if (action.seq <= state.lastSeq) return state;
      return {
        ...state,
        pins: state.pins.filter((p) => p.pinId !== action.pinId),
        lastSeq: action.seq,
      };
    }
    case 'MEMBER_JOINED': {
      if (action.seq <= state.lastSeq) return state;
      const exists = state.members.some((m) => m.memberId === action.memberId);
      return {
        ...state,
        members: exists
          ? state.members
          : [...state.members, { memberId: action.memberId, displayName: action.displayName, role: 'MEMBER', joinedAt: '', online: true }],
        lastSeq: action.seq,
      };
    }
    case 'CURSORS':
      return { ...state, cursors: action.cursors };
    case 'PRESENCE':
      return {
        ...state,
        members: state.members.map((m) =>
          m.memberId === action.memberId ? { ...m, online: action.online } : m,
        ),
      };
    case 'WS_STATUS':
      return { ...state, wsStatus: action.status };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const CollabContext = createContext<CollabContextValue | null>(null);
export const useCollab = () => useContext(CollabContext);

// Legacy – MapPage guards on this
export const CollabActiveContext = createContext(false);
export const useCollabActive = () => useContext(CollabActiveContext);

// ─── Provider ───────────────────────────────────────────────────────────────

interface Props {
  roomId: string;
  children: ReactNode;
}

const CURSOR_THROTTLE_MS = 100;
const MAX_RECONNECT_DELAY_MS = 30_000;

export function MapCollabProvider({ roomId, children }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);
  const lastSeqRef = useRef(-1);

  // ACK/EVENT 중복 제거: 적용된 seq 추적
  const appliedSeqsRef = useRef(new Set<number>());

  // 커서 throttle
  const lastCursorSentRef = useRef(0);

  // seq 변화 추적 (ref 형태로)
  useEffect(() => {
    lastSeqRef.current = state.lastSeq;
  }, [state.lastSeq]);

  // ── Snapshot fetch (RESYNC 혹은 초기) ──────────────────────────────────────
  const fetchSnapshot = useCallback(async () => {
    try {
      const [snap, detail] = await Promise.all([
        mapCollabApi.getSnapshot(roomId),
        mapCollabApi.getRoom(roomId),
      ]);
      appliedSeqsRef.current.clear();
      dispatch({
        type: 'SNAPSHOT',
        payload: {
          pins: snap.pins,
          lastSeq: snap.lastSeq,
          room: detail.room,
          members: detail.members,
        },
      });
      return snap.lastSeq;
    } catch {
      dispatch({ type: 'WS_STATUS', status: 'error' });
      return -1;
    }
  }, [roomId]);

  // ── WebSocket 연결 ──────────────────────────────────────────────────────────
  const connect = useCallback(
    (connectLastSeq: number) => {
      if (destroyedRef.current) return;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      dispatch({ type: 'WS_STATUS', status: connectLastSeq >= 0 ? 'reconnecting' : 'connecting' });
      const url = buildWsUrl(roomId, connectLastSeq >= 0 ? connectLastSeq : undefined);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = 1000;
        // lastSeq는 URL query string으로만 전달 (이슈 계약: "?lastSeq=N 또는 RESUME" — OR, 둘 다 아님)
      };

      ws.onmessage = (ev) => {
        let msg: WsServerMessage;
        try {
          msg = JSON.parse(ev.data as string) as WsServerMessage;
        } catch {
          return;
        }
        handleMessage(msg);
      };

      ws.onerror = () => {
        // onerror always fires before onclose; onclose handles reconnect
      };

      ws.onclose = (ev) => {
        if (destroyedRef.current) return;
        wsRef.current = null;
        // 4010 = ROOM_CLOSED, don't reconnect
        if (ev.code === 4010) {
          dispatch({ type: 'WS_STATUS', status: 'closed' });
          return;
        }
        dispatch({ type: 'WS_STATUS', status: 'reconnecting' });
        const delay = Math.min(reconnectDelayRef.current, MAX_RECONNECT_DELAY_MS);
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
        reconnectTimerRef.current = setTimeout(() => {
          connect(lastSeqRef.current);
        }, delay);
      };
    },
    [roomId],
  );

  // ── Message handler ─────────────────────────────────────────────────────────
  function handleMessage(msg: WsServerMessage) {
    switch (msg.type) {
      case 'WELCOME': {
        const p = msg.payload;
        dispatch({
          type: 'WELCOME',
          payload: {
            room: p.room,
            myMemberId: p.me.memberId,
            myDisplayName: p.me.displayName,
            members: p.members,
            pins: p.pins,
            lastSeq: p.lastSeq,
          },
        });
        break;
      }
      case 'ACK': {
        const p = msg.payload;
        if (appliedSeqsRef.current.has(p.seq)) break; // EVENT 먼저 왔으면 무시
        appliedSeqsRef.current.add(p.seq);
        if (p.pin) dispatch({ type: 'PIN_ADDED', seq: p.seq, pin: p.pin });
        else if (p.pinId) dispatch({ type: 'PIN_REMOVED', seq: p.seq, pinId: p.pinId });
        break;
      }
      case 'EVENT': {
        const p = msg.payload;
        if (appliedSeqsRef.current.has(p.seq)) break;
        appliedSeqsRef.current.add(p.seq);
        if (p.eventType === 'PIN_ADDED' && p.pin) {
          dispatch({ type: 'PIN_ADDED', seq: p.seq, pin: p.pin });
        } else if (p.eventType === 'PIN_REMOVED' && p.pinId) {
          dispatch({ type: 'PIN_REMOVED', seq: p.seq, pinId: p.pinId });
        } else if (p.eventType === 'MEMBER_JOINED' && p.actor) {
          dispatch({ type: 'MEMBER_JOINED', seq: p.seq, memberId: p.actor.memberId, displayName: p.actor.displayName });
        } else if (p.eventType === 'ROOM_CLOSED') {
          dispatch({ type: 'WS_STATUS', status: 'closed' });
        }
        break;
      }
      case 'ERROR': {
        // 사용자에게 오류 표시
        const code = msg.payload.code;
        if (code === 'PIN_ALREADY_EXISTS') {
          toast.error('이미 핀이 있는 장소예요.');
        } else if (code === 'PIN_LIMIT_EXCEEDED') {
          toast.error('핀을 더 이상 추가할 수 없어요. (최대 100개)');
        } else if (code === 'ROOM_EXPIRED' || code === 'ROOM_CLOSED') {
          toast.error('공유 지도가 종료됐어요.');
          dispatch({ type: 'WS_STATUS', status: 'closed' });
        }
        break;
      }
      case 'CURSORS':
        dispatch({ type: 'CURSORS', cursors: msg.payload.cursors });
        break;
      case 'PRESENCE':
        dispatch({ type: 'PRESENCE', memberId: msg.payload.memberId, online: msg.payload.online });
        break;
      case 'RESYNC_REQUIRED':
        // GAP 발생 — snapshot 다시 받고 재연결
        fetchSnapshot().then((seq) => connect(seq));
        break;
    }
  }

  // ── Mount: 초기 snapshot → WebSocket 연결 ───────────────────────────────────
  useEffect(() => {
    destroyedRef.current = false;
    fetchSnapshot().then((seq) => {
      if (!destroyedRef.current) connect(seq);
    });

    return () => {
      destroyedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, fetchSnapshot, connect]);

  // ── 입장 toast (1회) ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.wsStatus !== 'connected') return;
    const key = `collab_joined_${roomId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage 불가 */ }
    toast.info('공유 지도에 참여했어요', {
      description: '이 링크는 72시간 동안 유지돼요.',
      duration: 4000,
    });
  }, [state.wsStatus, roomId]);

  // ── API: 핀 추가 ─────────────────────────────────────────────────────────────
  const addPin = useCallback(
    (placeId: string) => {
      const opId = crypto.randomUUID();
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ v: 1, type: 'PIN_ADD', opId, payload: { placeId } }));
      } else {
        // WS 없으면 REST 폴백
        mapCollabApi.addPin(roomId, placeId, opId).catch((err) => {
          const code = (err as { code?: string })?.code;
          if (code === 'PIN_ALREADY_EXISTS') toast.error('이미 핀이 있는 장소예요.');
          else if (code === 'PIN_LIMIT_EXCEEDED') toast.error('핀을 더 이상 추가할 수 없어요.');
        });
      }
    },
    [roomId],
  );

  // ── API: 핀 제거 ─────────────────────────────────────────────────────────────
  const removePin = useCallback(
    (pinId: string) => {
      const opId = crypto.randomUUID();
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ v: 1, type: 'PIN_REMOVE', opId, payload: { pinId } }));
      } else {
        mapCollabApi.removePin(roomId, pinId, opId).catch(() => {});
      }
    },
    [roomId],
  );

  // ── API: 커서 (100ms throttle) ───────────────────────────────────────────────
  const sendCursor = useCallback(
    (lat: number | null, lng: number | null) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current < CURSOR_THROTTLE_MS) return;
      lastCursorSentRef.current = now;
      const ws = wsRef.current;
      if (ws?.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ v: 1, type: 'CURSOR', payload: { lat, lng } }));
    },
    [],
  );

  // ── API: 초대 생성 ────────────────────────────────────────────────────────────
  const createInvite = useCallback(async () => {
    const res = await mapCollabApi.createInvite(roomId);
    return { shareUrl: res.invite.shareUrl };
  }, [roomId]);

  const ctx: CollabContextValue = {
    roomId,
    room: state.room,
    myMemberId: state.myMemberId,
    myDisplayName: state.myDisplayName,
    members: state.members,
    pins: state.pins,
    cursors: state.cursors,
    wsStatus: state.wsStatus,
    addPin,
    removePin,
    sendCursor,
    createInvite,
  };

  return (
    <CollabActiveContext.Provider value={true}>
      <CollabContext.Provider value={ctx}>{children}</CollabContext.Provider>
    </CollabActiveContext.Provider>
  );
}
