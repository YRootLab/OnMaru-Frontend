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

/**
 * 새 계약(JourneyBoard) 탐색 호출. `/api/journey-curator/explore`는 TourAPI 실제 장소 +
 * Gemini로 후보를 고른다 — 실패하면 ok:false와 사람이 읽을 메시지를 돌려주고,
 * 호출부가 이전 board를 유지한 채 그 메시지를 보여줄 수 있게 한다(지어낸 성공으로 위장하지 않는다).
 *
 * refine을 주면 고정된 장소(pinnedPlaces)는 그대로 유지되고, 나머지 자리만 새로 채워진
 * 결과와 kept/added/removed diff가 함께 온다.
 */
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
