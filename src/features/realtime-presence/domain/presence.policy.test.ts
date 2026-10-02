import { describe, expect, it } from 'vitest';
import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  MAX_RECONNECT_ATTEMPTS,
  MAX_SPAWNS_PER_FRAME,
  TAB_HIDDEN_DISCONNECT_MS,
  WARMTH_THROTTLE_MS,
  canSendWarmth,
  clampSpawnCount,
  isTabVisible,
  nextBackoffMs,
  shouldDisconnectOnHidden,
} from './presence.policy';

describe('canSendWarmth', () => {
  it('쓰로틀 구간이 지나면 전송 허용', () => {
    expect(canSendWarmth(0, WARMTH_THROTTLE_MS)).toBe(true);
    expect(canSendWarmth(0, WARMTH_THROTTLE_MS + 1)).toBe(true);
  });

  it('쓰로틀 구간 내에는 전송 차단', () => {
    expect(canSendWarmth(0, WARMTH_THROTTLE_MS - 1)).toBe(false);
    expect(canSendWarmth(1000, 1299)).toBe(false);
  });
});

describe('clampSpawnCount', () => {
  it('상한 이하는 그대로 반환', () => {
    expect(clampSpawnCount(0)).toBe(0);
    expect(clampSpawnCount(MAX_SPAWNS_PER_FRAME)).toBe(MAX_SPAWNS_PER_FRAME);
  });

  it('상한 초과분은 잘라낸다', () => {
    expect(clampSpawnCount(MAX_SPAWNS_PER_FRAME + 5)).toBe(MAX_SPAWNS_PER_FRAME);
  });
});

describe('isTabVisible', () => {
  it('visible 상태면 true', () => {
    expect(isTabVisible('visible')).toBe(true);
  });

  it('hidden 상태면 false (유휴로 판정)', () => {
    expect(isTabVisible('hidden')).toBe(false);
  });
});

describe('nextBackoffMs', () => {
  it('attempt 0에서 BACKOFF_BASE_MS 반환 (지터 0)', () => {
    expect(nextBackoffMs(0, 0.5)).toBe(BACKOFF_BASE_MS);
  });

  it('매 attempt마다 2배씩 증가', () => {
    const a0 = nextBackoffMs(0, 0.5);
    const a1 = nextBackoffMs(1, 0.5);
    const a2 = nextBackoffMs(2, 0.5);
    expect(a1).toBe(a0 * 2);
    expect(a2).toBe(a0 * 4);
  });

  it('큰 attempt에서 BACKOFF_MAX_MS로 수렴', () => {
    expect(nextBackoffMs(20, 0.5)).toBe(BACKOFF_MAX_MS);
  });

  it('지터 ±20% 범위 내에 있다', () => {
    const base = BACKOFF_BASE_MS;
    expect(nextBackoffMs(0, 0)).toBe(Math.round(base * 0.8));  // -20%
    expect(nextBackoffMs(0, 1)).toBe(Math.round(base * 1.2));  // +20%
  });

  it(`MAX_RECONNECT_ATTEMPTS는 ${MAX_RECONNECT_ATTEMPTS}`, () => {
    expect(MAX_RECONNECT_ATTEMPTS).toBe(5);
  });
});

describe('shouldDisconnectOnHidden', () => {
  it('30초 미만이면 연결 유지', () => {
    expect(shouldDisconnectOnHidden(0, TAB_HIDDEN_DISCONNECT_MS - 1)).toBe(false);
  });

  it('30초 경계에서 종료', () => {
    expect(shouldDisconnectOnHidden(0, TAB_HIDDEN_DISCONNECT_MS)).toBe(true);
  });

  it('30초 초과해도 종료', () => {
    expect(shouldDisconnectOnHidden(1000, 1000 + TAB_HIDDEN_DISCONNECT_MS + 5_000)).toBe(true);
  });

  it('절대 시각이 아닌 경과 시간 기준', () => {
    const base = 1_740_000_000_000;
    expect(shouldDisconnectOnHidden(base, base + TAB_HIDDEN_DISCONNECT_MS - 1)).toBe(false);
    expect(shouldDisconnectOnHidden(base, base + TAB_HIDDEN_DISCONNECT_MS)).toBe(true);
  });
});
