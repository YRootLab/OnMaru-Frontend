import type { JourneyBoard, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';

/**
 * "저장" 누를 때 비회원이면 카카오 로그인으로 이동했다가 돌아온다(seven-day-mvp-fe-handoff.md §11).
 * 이동하는 동안 useJourneyStore(메모리만 씀)는 날아가므로, 지금 board를 sessionStorage에
 * 잠깐 맡겨뒀다가 로그인 콜백이 돌아오면 다시 꺼내 저장을 마저 끝낸다.
 */

const KEY = 'onmaru_pending_save_v1';

export interface PendingSave {
  board: JourneyBoard;
  pinnedRefs: ResourceRef[];
  title: string;
  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];
}

export function setPendingSave(payload: PendingSave): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // 저장 실패해도 로그인 자체는 막지 않는다.
  }
}

export function getPendingSave(): PendingSave | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingSave) : null;
  } catch {
    return null;
  }
}

export function clearPendingSave(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

export function hasPendingSave(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem(KEY) !== null;
}
