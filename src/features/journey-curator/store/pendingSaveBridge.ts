import type { JourneyBoard, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';







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
