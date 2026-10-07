import type { IPresenceTransport, TransportConnectionEvent } from '../application/presence.port';
import type {
  ClientId,
  PresenceSnapshot,
  RoomId,
  WarmthEvent,
  WarmthType,
} from '../domain/presence.types';

/**
 * 6.4 API 계약: 스트림 URL 생성
 * GET /api/v1/realtime/presence/stream?roomId={roomId}&clientId={clientId}
 */
export function buildPresenceStreamUrl(
  baseUrl: string,
  roomId: string,
  clientId: string,
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const prefix = cleanBase.endsWith('/api/v1') ? '' : '/api/v1';
  const params = new URLSearchParams({ roomId, clientId });
  return `${cleanBase}${prefix}/realtime/presence/stream?${params.toString()}`;
}

/**
 * 6.4 API 계약: 온기 전송 URL 생성
 * POST /api/v1/realtime/warmth
 */
export function buildPresenceWarmthUrl(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const prefix = cleanBase.endsWith('/api/v1') ? '' : '/api/v1';
  return `${cleanBase}${prefix}/realtime/warmth`;
}

/**
 * 6.4 이벤트 파싱: snapshot
 * JSON 파싱 실패 또는 필드 누락/타입 불일치 시 null 반환 (앱 크래시 방지)
 */
export function parsePresenceSnapshot(data: string): PresenceSnapshot | null {
  try {
    const parsed = JSON.parse(data);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.roomId === 'string' &&
      parsed.roomId.length > 0 &&
      typeof parsed.activeCount === 'number' &&
      Number.isFinite(parsed.activeCount) &&
      typeof parsed.todayVisitors === 'number' &&
      Number.isFinite(parsed.todayVisitors) &&
      typeof parsed.serverTime === 'number' &&
      Number.isFinite(parsed.serverTime)
    ) {
      return {
        roomId: parsed.roomId,
        activeCount: parsed.activeCount,
        todayVisitors: parsed.todayVisitors,
        serverTime: parsed.serverTime,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function isValidSingleWarmth(item: unknown): item is WarmthEvent {
  if (typeof item !== 'object' || item === null) return false;
  const cand = item as Record<string, unknown>;
  return (
    typeof cand.type === 'string' &&
    cand.type.length > 0 &&
    typeof cand.x === 'number' &&
    Number.isFinite(cand.x) &&
    cand.x >= 0 &&
    cand.x <= 1 &&
    typeof cand.ts === 'number' &&
    Number.isFinite(cand.ts)
  );
}

/**
 * 6.4 이벤트 파싱: warmth
 * 단일 이벤트 객체 또는 배치(coalesce) 배열 형태 모두 지원
 * 검증 실패 시 null 반환
 */
export function parseWarmthEvent(data: string): WarmthEvent[] | null {
  try {
    const parsed = JSON.parse(data);
    if (isValidSingleWarmth(parsed)) {
      return [parsed];
    }
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidSingleWarmth)) {
      return parsed;
    }
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray(parsed.events) &&
      parsed.events.length > 0 &&
      parsed.events.every(isValidSingleWarmth)
    ) {
      return parsed.events;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 세션 단위 익명 clientId 생성/조회 (sessionStorage 보관, 계정 비연결)
 */
export function getOrCreatePresenceClientId(): string {
  if (typeof window === 'undefined') return 'c_ssr';
  try {
    const key = 'omrp_cid';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `c_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `c_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }
}

export interface SsePresenceTransportOptions {
  baseUrl?: string;
  eventSourceFactory?: (url: string) => EventSource;
  fetcher?: typeof fetch;
}

/**
 * SSE 기반 실시간 Presence Transport 구현체 (IPresenceTransport)
 * - EventSource 브라우저 내장 자동 재연결 차단 (에러 시 즉시 close 후 상태 머신에 위임)
 * - 온기 전송: POST /api/v1/realtime/warmth (fire-and-forget, 에러/429 조용히 무시)
 */
export function createSsePresenceTransport(
  options: SsePresenceTransportOptions = {},
): IPresenceTransport {
  const baseUrl = options.baseUrl ?? (process.env.NEXT_PUBLIC_API_URL || '');
  const eventSourceFactory =
    options.eventSourceFactory ??
    ((url: string) => new EventSource(url));
  const fetcher =
    options.fetcher ??
    ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));

  let eventSource: EventSource | null = null;
  let activeRoomId: RoomId | null = null;
  let activeClientId: ClientId | null = null;

  const snapshotHandlers = new Set<(snapshot: PresenceSnapshot) => void>();
  const warmthHandlers = new Set<(event: WarmthEvent) => void>();
  const connectionHandlers = new Set<(event: TransportConnectionEvent) => void>();

  function emitConnection(event: TransportConnectionEvent) {
    connectionHandlers.forEach((handler) => handler(event));
  }

  function emitSnapshot(snapshot: PresenceSnapshot) {
    snapshotHandlers.forEach((handler) => handler(snapshot));
  }

  function emitWarmth(event: WarmthEvent) {
    warmthHandlers.forEach((handler) => handler(event));
  }

  function cleanupEventSource() {
    if (eventSource) {
      try {
        eventSource.close();
      } catch {
        // 이미 닫혔거나 해제된 경우 무시
      }
      eventSource = null;
    }
  }

  return {
    connect(roomId: RoomId, clientId: ClientId): void {
      // 기존 연결이 있으면 먼저 해제
      cleanupEventSource();

      activeRoomId = roomId;
      activeClientId = clientId || getOrCreatePresenceClientId();

      const url = buildPresenceStreamUrl(baseUrl, activeRoomId, activeClientId);

      try {
        const es = eventSourceFactory(url);
        eventSource = es;

        es.onopen = () => {
          emitConnection('open');
        };

        es.addEventListener('snapshot', (e: MessageEvent) => {
          const snapshot = parsePresenceSnapshot(e.data);
          if (snapshot) {
            emitSnapshot(snapshot);
          }
        });

        es.addEventListener('warmth', (e: MessageEvent) => {
          const events = parseWarmthEvent(e.data);
          if (events) {
            events.forEach((ev) => emitWarmth(ev));
          }
        });

        es.onerror = () => {
          // 브라우저의 자체 자동 재연결을 막기 위해 즉시 close
          cleanupEventSource();
          // 상태 머신에게 연결 종료를 전달해 백오프 재연결이 중복 없이 동작하도록 함
          emitConnection('closed');
        };
      } catch (err) {
        cleanupEventSource();
        emitConnection('closed');
      }
    },

    close(): void {
      cleanupEventSource();
      emitConnection('closed');
    },

    sendWarmth(payload: { roomId: RoomId; type: WarmthType; x: number }): void {
      const url = buildPresenceWarmthUrl(baseUrl);
      const cId = activeClientId || getOrCreatePresenceClientId();
      const body = JSON.stringify({
        roomId: payload.roomId,
        clientId: cId,
        type: payload.type,
        x: payload.x,
      });

      // Fire-and-forget: credentials 없음, 204=성공, 429=조용히 무시, 400=console.warn만
      try {
        const promise = fetcher(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          body,
        });
        if (promise && typeof promise.then === 'function') {
          promise
            .then((res) => {
              if (res.status === 400) {
                console.warn('[presence] warmth 400 Bad Request — payload rejected by server');
              }
            })
            .catch(() => {
              // 429, 네트워크 오류 등 조용히 무시
            });
        }
      } catch {
        // 즉시 예외 무시
      }
    },

    onSnapshot(handler: (snapshot: PresenceSnapshot) => void): () => void {
      snapshotHandlers.add(handler);
      return () => {
        snapshotHandlers.delete(handler);
      };
    },

    onWarmth(handler: (event: WarmthEvent) => void): () => void {
      warmthHandlers.add(handler);
      return () => {
        warmthHandlers.delete(handler);
      };
    },

    onConnectionChange(handler: (event: TransportConnectionEvent) => void): () => void {
      connectionHandlers.add(handler);
      return () => {
        connectionHandlers.delete(handler);
      };
    },
  };
}
