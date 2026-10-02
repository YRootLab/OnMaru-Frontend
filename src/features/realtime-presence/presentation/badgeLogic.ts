// 3.1절 디바운스·유지 시간 상수
export const DISPLAY_DEBOUNCE_MS = 500;
export const DISPLAY_MIN_HOLD_MS = 1_000;
// 3.3절 aria-live 5초 최소 간격
export const ARIA_ANNOUNCE_INTERVAL_MS = 5_000;

// 2.2절 상태별 표시 문구
export interface PresenceMainText {
  text: string;
  isAlone: boolean; // true면 온이 연출, false면 골드 펄스
}

export function getMainText(activeCount: number): PresenceMainText {
  if (activeCount >= 2) {
    return { text: `${activeCount}명이 함께 머무는 중`, isAlone: false };
  }
  return { text: '지금 대청마루에는 온이와 함께 있어요', isAlone: true };
}

// 2.3절 비동기 Presence 보조 문구 (0이면 숨김)
export function getTodayVisitorsText(todayVisitors: number): string | null {
  if (todayVisitors <= 0) return null;
  return `오늘 ${todayVisitors}명이 다녀갔어요`;
}

// 3.1절: 디바운스(500ms) AND 최소 유지(1s) 둘 다 만족해야 표시 갱신
export function shouldUpdateCount(
  lastUpdatedAt: number,   // 마지막으로 화면에 반영한 시각
  pendingChangedAt: number, // 새 값이 도착한 시각
  now: number,
): boolean {
  return (
    now - lastUpdatedAt >= DISPLAY_MIN_HOLD_MS &&
    now - pendingChangedAt >= DISPLAY_DEBOUNCE_MS
  );
}

// 3.3절: aria-live 5초 이상 간격
export function shouldAnnounce(lastAnnouncedAt: number, now: number): boolean {
  return now - lastAnnouncedAt >= ARIA_ANNOUNCE_INTERVAL_MS;
}
