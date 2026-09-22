import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';

export interface ExplorationDiff {
  keptRefs: ResourceRef[];
  addedRefs: ResourceRef[];
  removedRefs: ResourceRef[];
}

export interface ExplorationResult {
  board: JourneyBoard;
  aiGenerated: boolean;
  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];
  diff: ExplorationDiff | null;
}

export type ExplorationFetchResult =
  | ({ ok: true } & ExplorationResult)
  | { ok: false; message: string; retryable: boolean };

export interface ExploreRefineOptions {
  pinnedPlaces: PlaceResource[];
  previousPlaceIds: string[];
  previousRegionId: string;
}









export async function fetchExplorationBoard(
  query: string,
  refine?: ExploreRefineOptions,
): Promise<ExplorationFetchResult> {
  try {
    const res = await fetch('/api/journey-curator/explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        ...(refine
          ? {
              mode: 'REFINE',
              pinnedPlaces: refine.pinnedPlaces,
              previousPlaceIds: refine.previousPlaceIds,
              previousRegionId: refine.previousRegionId,
            }
          : {}),
      }),
    });
    const data = await res.json();

    if (data?.error || !data?.board) {
      console.warn('[fetchExplorationBoard] error response:', data?.error);
      return {
        ok: false,
        message: data?.error?.message || '실제 장소를 찾지 못했어요.',
        retryable: data?.error?.retryable ?? true,
      };
    }

    return {
      ok: true,
      board: data.board as JourneyBoard,
      aiGenerated: Boolean(data.aiGenerated),
      hanokDogan: data.hanokDogan ?? [],
      nearbyAudio: data.nearbyAudio ?? [],
      nearbyFood: data.nearbyFood ?? [],
      diff: data.diff ?? null,
    };
  } catch (err) {
    console.warn('[fetchExplorationBoard] network/parse error:', err);
    return { ok: false, message: '연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.', retryable: true };
  }
}
