import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_RECONNECT_ATTEMPTS } from '../domain/presence.policy';
import type { PresenceSnapshot } from '../domain/presence.types';
import {
  type PresenceRoomAction,
  type PresenceRoomState,
  canStartReconnectBackoff,
  createHiddenTimer,
  presenceRoomReducer,
} from './usePresenceRoom';

const idle: PresenceRoomState = { connection: 'idle', snapshot: null, reconnectAttempts: 0 };

// ─── 가시성 기반 연결 관리 (요건 1~5) ────────────────────────────────────────

describe('요건 1 — hidden 동안 백오프 시작 안 됨', () => {
  it('reconnecting + hidden: 백오프 조건 미충족', () => {
    expect(canStartReconnectBackoff('reconnecting', 'hidden')).toBe(false);
  });

  it('reconnecting + visible: 백오프 조건 충족', () => {
    expect(canStartReconnectBackoff('reconnecting', 'visible')).toBe(true);
  });

  it('open + visible: reconnecting 아니면 백오프 없음', () => {
    expect(canStartReconnectBackoff('open', 'visible')).toBe(false);
  });
});

describe('요건 2 — VISIBILITY_PAUSE: attempts 증가 없음 (5회 규칙 영향 없음)', () => {
  it('open → VISIBILITY_PAUSE → reconnecting, attempts 변화 없음', () => {
    const s: PresenceRoomState = { ...idle, connection: 'open', reconnectAttempts: 0 };
    const next = presenceRoomReducer(s, { type: 'VISIBILITY_PAUSE' });
    expect(next.connection).toBe('reconnecting');
    expect(next.reconnectAttempts).toBe(0);
  });

  it('VISIBILITY_PAUSE 5회 반복 — degraded 진입 안 됨', () => {
    let state: PresenceRoomState = { ...idle, connection: 'open' };
    for (let i = 0; i < 5; i++) {
      // 매번 open으로 리셋해서 시나리오 재현
      state = presenceRoomReducer({ ...state, connection: 'open' }, { type: 'VISIBILITY_PAUSE' });
    }
    expect(state.connection).not.toBe('degraded');
    expect(state.reconnectAttempts).toBe(0);
  });

  it('VISIBILITY_PAUSE: closed/degraded에서는 무시', () => {
    for (const conn of ['closed', 'degraded'] as const) {
      const s: PresenceRoomState = { ...idle, connection: conn };
      expect(presenceRoomReducer(s, { type: 'VISIBILITY_PAUSE' }).connection).toBe(conn);
    }
  });
});

describe('요건 3 — VISIBILITY_RECONNECT: 대기 없이 즉시 재연결, attempts 0 초기화', () => {
  it('reconnecting(attempts=3) → VISIBILITY_RECONNECT → connecting, attempts=0', () => {
    const s: PresenceRoomState = { ...idle, connection: 'reconnecting', reconnectAttempts: 3 };
    const next = presenceRoomReducer(s, { type: 'VISIBILITY_RECONNECT' });
    expect(next.connection).toBe('connecting');
    expect(next.reconnectAttempts).toBe(0);
  });

  it('reconnecting 아닌 상태에서는 VISIBILITY_RECONNECT 무시', () => {
    for (const conn of ['open', 'connecting', 'closed', 'degraded'] as const) {
      const s: PresenceRoomState = { ...idle, connection: conn };
      expect(presenceRoomReducer(s, { type: 'VISIBILITY_RECONNECT' }).connection).toBe(conn);
    }
  });
});

describe('요건 4 — 복귀 후 degraded 아닌 정상 흐름으로 돌아옴', () => {
  it('VISIBILITY_PAUSE → VISIBILITY_RECONNECT → TRANSPORT_OPEN: degraded 없이 open', () => {
    // 시나리오: hidden 30초 → 연결 종료 → visible 복귀 → 즉시 재연결 → open
    let state: PresenceRoomState = { ...idle, connection: 'open', reconnectAttempts: 4 };
    state = presenceRoomReducer(state, { type: 'VISIBILITY_PAUSE' });     // reconnecting, attempts=4 유지
    state = presenceRoomReducer(state, { type: 'VISIBILITY_RECONNECT' }); // connecting, attempts=0
    state = presenceRoomReducer(state, { type: 'TRANSPORT_OPEN' });       // open, attempts=0
    expect(state.connection).toBe('open');
    expect(state.reconnectAttempts).toBe(0);
  });

  it('attempts가 MAX에 근접해도 VISIBILITY_PAUSE → VISIBILITY_RECONNECT는 degraded 안 됨', () => {
    // attempts=4 (한 번만 더 TRANSPORT_CLOSE면 degraded가 됐을 상황)
    let state: PresenceRoomState = { ...idle, connection: 'open', reconnectAttempts: 4 };
    state = presenceRoomReducer(state, { type: 'VISIBILITY_PAUSE' });
    expect(state.connection).toBe('reconnecting');
    expect(state.reconnectAttempts).toBe(4); // 증가 없음
    state = presenceRoomReducer(state, { type: 'VISIBILITY_RECONNECT' });
    expect(state.connection).toBe('connecting');
    expect(state.reconnectAttempts).toBe(0); // 리셋
  });
});

describe('요건 5 — hidden 30초 미만이면 연결 종료 안 됨', () => {
  afterEach(() => vi.useRealTimers());

  it('29.999초 후 복귀: 타이머 취소로 콜백 미호출', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const timer = createHiddenTimer(onTimeout, 30_000);
    timer.start();
    vi.advanceTimersByTime(29_999);
    timer.cancel(); // 30초 전 visible 복귀
    vi.advanceTimersByTime(30_000); // 이후 어떤 시간이 지나도
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('30초 정확히 경과 후 콜백 호출', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const timer = createHiddenTimer(onTimeout, 30_000);
    timer.start();
    vi.advanceTimersByTime(30_000);
    expect(onTimeout).toHaveBeenCalledOnce();
    timer.cancel();
  });
});

describe('createHiddenTimer — 가시성 타이머', () => {
  afterEach(() => vi.useRealTimers());

  it('지정 시간 후 콜백 호출', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const timer = createHiddenTimer(cb, 30_000);
    timer.start();
    vi.advanceTimersByTime(29_999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledOnce();
    timer.cancel();
  });

  it('cancel 호출 후에는 콜백 호출 안 됨 (30초 미만 복귀)', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const timer = createHiddenTimer(cb, 30_000);
    timer.start();
    vi.advanceTimersByTime(15_000);
    timer.cancel();
    vi.advanceTimersByTime(30_000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('start 중복 호출 시 타이머가 리셋됨', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const timer = createHiddenTimer(cb, 30_000);
    timer.start();
    vi.advanceTimersByTime(20_000);
    timer.start(); // 리셋
    vi.advanceTimersByTime(29_999);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledOnce();
    timer.cancel();
  });
});

describe('presenceRoomReducer — 상태 머신', () => {
  it('idle → CONNECT → connecting', () => {
    expect(presenceRoomReducer(idle, { type: 'CONNECT' }).connection).toBe('connecting');
  });

  it('connecting → TRANSPORT_OPEN → open, attempts 초기화', () => {
    const s: PresenceRoomState = { ...idle, connection: 'connecting', reconnectAttempts: 2 };
    const next = presenceRoomReducer(s, { type: 'TRANSPORT_OPEN' });
    expect(next.connection).toBe('open');
    expect(next.reconnectAttempts).toBe(0);
  });

  it('connecting → TRANSPORT_CLOSE → reconnecting, attempts 증가', () => {
    const s: PresenceRoomState = { ...idle, connection: 'connecting' };
    const next = presenceRoomReducer(s, { type: 'TRANSPORT_CLOSE' });
    expect(next.connection).toBe('reconnecting');
    expect(next.reconnectAttempts).toBe(1);
  });

  it('open → TRANSPORT_CLOSE → reconnecting', () => {
    const s: PresenceRoomState = { ...idle, connection: 'open' };
    expect(presenceRoomReducer(s, { type: 'TRANSPORT_CLOSE' }).connection).toBe('reconnecting');
  });

  it(`${MAX_RECONNECT_ATTEMPTS}회 연속 실패 → degraded`, () => {
    let state: PresenceRoomState = { ...idle, connection: 'connecting' };
    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
      // 훅이 reconnect effect에서 CONNECT를 dispatch하는 것을 재현
      state = presenceRoomReducer({ ...state, connection: 'connecting' }, { type: 'TRANSPORT_CLOSE' });
    }
    expect(state.connection).toBe('degraded');
  });

  it('reconnecting → TRANSPORT_OPEN → open (attempts 리셋)', () => {
    const s: PresenceRoomState = { ...idle, connection: 'reconnecting', reconnectAttempts: 3 };
    const next = presenceRoomReducer(s, { type: 'TRANSPORT_OPEN' });
    expect(next.connection).toBe('open');
    expect(next.reconnectAttempts).toBe(0);
  });

  it('reconnecting → CONNECT → connecting (attempts 유지)', () => {
    const s: PresenceRoomState = { ...idle, connection: 'reconnecting', reconnectAttempts: 2 };
    const next = presenceRoomReducer(s, { type: 'CONNECT' });
    expect(next.connection).toBe('connecting');
    expect(next.reconnectAttempts).toBe(2);
  });

  it('모든 비-closed 상태 → CLOSE → closed', () => {
    const states: PresenceRoomState['connection'][] = [
      'idle',
      'connecting',
      'open',
      'reconnecting',
      'degraded',
    ];
    for (const conn of states) {
      const s: PresenceRoomState = { ...idle, connection: conn };
      expect(presenceRoomReducer(s, { type: 'CLOSE' }).connection).toBe('closed');
    }
  });

  it('degraded 상태에서 TRANSPORT_CLOSE 무시', () => {
    const s: PresenceRoomState = { ...idle, connection: 'degraded' };
    expect(presenceRoomReducer(s, { type: 'TRANSPORT_CLOSE' }).connection).toBe('degraded');
  });

  it('closed 상태에서 CONNECT 무시', () => {
    const s: PresenceRoomState = { ...idle, connection: 'closed' };
    expect(presenceRoomReducer(s, { type: 'CONNECT' }).connection).toBe('closed');
  });

  it('reconnecting → CONNECT → connecting (attempts 유지, 즉시 재연결에 사용)', () => {
    const s: PresenceRoomState = { ...idle, connection: 'reconnecting', reconnectAttempts: 1 };
    const next = presenceRoomReducer(s, { type: 'CONNECT' });
    expect(next.connection).toBe('connecting');
    expect(next.reconnectAttempts).toBe(1); // attempts는 유지 (backoff 계산용)
  });

  it('UPDATE_SNAPSHOT은 연결 상태에 무관하게 snapshot 갱신', () => {
    const snap: PresenceSnapshot = {
      roomId: 'hanok_anchae',
      activeCount: 7,
      todayVisitors: 132,
      serverTime: 1740000000,
    };
    const s: PresenceRoomState = { ...idle, connection: 'open' };
    expect(presenceRoomReducer(s, { type: 'UPDATE_SNAPSHOT', payload: snap }).snapshot).toEqual(snap);
  });
});
