import type { CongestionLevel } from '@/map/types';

/**
 * 혼잡도 0~100을 읽는 규칙.
 *
 * 서버는 날짜별 점수를 만들고, 클라이언트는 스크러버가 고른 날의 점수를 등급과
 * 커널 세기로 옮긴다. 경계가 두 곳에 흩어지면 뱃지가 '북적'이라 말하는데
 * 히트맵은 옅게 칠하는 일이 생기므로 여기 한 곳만 둔다.
 */

export function levelOf(score: number): CongestionLevel {
  if (score >= 75) return 'surge';
  if (score >= 50) return 'busy';
  if (score >= 30) return 'moderate';
  return 'relaxed';
}

/** 히트 커널의 세기. 가장 한적한 날도 흔적은 남도록 바닥을 깐다. */
export function intensityOf(score: number): number {
  return Math.min(1, Math.max(0.25, score / 100));
}
