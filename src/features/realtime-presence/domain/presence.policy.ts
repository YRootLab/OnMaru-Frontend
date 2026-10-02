// 3.2 클라이언트 쓰로틀: 300ms에 1회
export const WARMTH_THROTTLE_MS = 300;

export function canSendWarmth(lastSentAt: number, now: number): boolean {
  return now - lastSentAt >= WARMTH_THROTTLE_MS;
}

// 3.2 수신 반응 프레임당 스폰 상한
export const MAX_SPAWNS_PER_FRAME = 3;

export function clampSpawnCount(incoming: number): number {
  return Math.min(incoming, MAX_SPAWNS_PER_FRAME);
}

// 5.3 탭 가시성 기반 유휴 판정
export function isTabVisible(visibilityState: DocumentVisibilityState): boolean {
  return visibilityState === 'visible';
}

// 7.3 탭이 hidden 된 뒤 30초가 지나면 연결 종료
export const TAB_HIDDEN_DISCONNECT_MS = 30_000;
export function shouldDisconnectOnHidden(hiddenSince: number, now: number): boolean {
  return now - hiddenSince >= TAB_HIDDEN_DISCONNECT_MS;
}

// 4.2 백오프: 1s → 2s → 4s → 8s → max 30s, ±20% 지터
export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;
export const MAX_RECONNECT_ATTEMPTS = 5; // 5회 연속 실패 시 degraded

// jitterFactor: 0–1 (기본 Math.random(), 테스트에서 고정값 주입)
export function nextBackoffMs(attempt: number, jitterFactor = Math.random()): number {
  const base = Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
  const jitter = base * 0.2 * (jitterFactor * 2 - 1);
  return Math.round(base + jitter);
}
