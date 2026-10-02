import { describe, expect, it } from 'vitest';
import {
  ARIA_ANNOUNCE_INTERVAL_MS,
  DISPLAY_DEBOUNCE_MS,
  DISPLAY_MIN_HOLD_MS,
  getMainText,
  getTodayVisitorsText,
  shouldAnnounce,
  shouldUpdateCount,
} from './badgeLogic';

const T = 1_000_000; // 임의의 기준 시각

describe('getMainText', () => {
  it('2명 이상이면 인원 수 포함 문구 반환', () => {
    const { text, isAlone } = getMainText(2);
    expect(text).toContain('2명이 함께 머무는 중');
    expect(isAlone).toBe(false);
  });

  it('10명도 올바르게 포맷', () => {
    expect(getMainText(10).text).toBe('10명이 함께 머무는 중');
  });

  it('1명이면 온이 문구, isAlone=true', () => {
    const { text, isAlone } = getMainText(1);
    expect(isAlone).toBe(true);
    expect(text).toContain('온이');
  });

  it('0명도 온이 문구', () => {
    expect(getMainText(0).isAlone).toBe(true);
  });
});

describe('getTodayVisitorsText', () => {
  it('0이면 null (보조 문구 숨김)', () => {
    expect(getTodayVisitorsText(0)).toBeNull();
  });

  it('양수면 "오늘 N명이 다녀갔어요"', () => {
    expect(getTodayVisitorsText(42)).toBe('오늘 42명이 다녀갔어요');
    expect(getTodayVisitorsText(1)).toBe('오늘 1명이 다녀갔어요');
  });
});

describe('shouldUpdateCount', () => {
  it('디바운스 + 최소 유지 둘 다 만족하면 true', () => {
    // lastUpdated=T, pendingAt=T+200, now=T+1600 → hold=1.6s≥1s, debounce=1.4s≥0.5s
    expect(shouldUpdateCount(T, T + 200, T + 1_600)).toBe(true);
  });

  it('최소 유지 시간 미달이면 false', () => {
    // lastUpdated=T, pendingAt=T, now=T+700 → hold=700ms < 1000ms
    expect(shouldUpdateCount(T, T, T + 700)).toBe(false);
  });

  it('디바운스 구간이면 false', () => {
    // lastUpdated=T-5000(충분히 오래됨), pendingAt=T, now=T+300 → debounce=300ms < 500ms
    expect(shouldUpdateCount(T - 5_000, T, T + 300)).toBe(false);
  });

  it(`경계값: hold=${DISPLAY_MIN_HOLD_MS}ms, debounce=${DISPLAY_DEBOUNCE_MS}ms 정확히 맞으면 true`, () => {
    expect(
      shouldUpdateCount(T - DISPLAY_MIN_HOLD_MS, T - DISPLAY_DEBOUNCE_MS, T),
    ).toBe(true);
  });
});

describe('shouldAnnounce', () => {
  it(`${ARIA_ANNOUNCE_INTERVAL_MS}ms 이상 지나면 true`, () => {
    expect(shouldAnnounce(T, T + ARIA_ANNOUNCE_INTERVAL_MS)).toBe(true);
    expect(shouldAnnounce(T, T + ARIA_ANNOUNCE_INTERVAL_MS + 1)).toBe(true);
  });

  it('5초 미만이면 false (스크린리더 폭주 방지)', () => {
    expect(shouldAnnounce(T, T + ARIA_ANNOUNCE_INTERVAL_MS - 1)).toBe(false);
  });
});
