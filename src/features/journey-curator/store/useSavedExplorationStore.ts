import { create } from 'zustand';
import { USE_MOCK } from '@/lib/api/client';
import type { JourneyBoard, ResourceRef, SavedJourneyDetail, SavedJourneySummary } from '../types/exploration.types';
import { defaultSavedJourneysRepository } from '../api/savedJourneysApi';

/**
 * FE #95: 새 계약(JourneyBoard)용 저장 여정. 백엔드가 준비된 지금은
 * /saved-journeys를 먼저 시도하고, 실패하면(백엔드 미설정/네트워크 오류/응답
 * shape 불일치) 이전과 동일하게 localStorage로 폴백한다 — savedJourneysApi.ts의
 * 응답 shape 가정이 실제와 다르더라도 저장 기능 자체는 항상 동작한다.
 *
 * rename은 백엔드에 대응 엔드포인트가 없어(GET/POST/GET détail/DELETE/resume
 * 5개뿐) 지금도 로컬 전용이다.
 */

const STORAGE_KEY = 'onmaru_saved_explorations_v1';

function toSummary(detail: SavedJourneyDetail): SavedJourneySummary {
  const firstPlace = detail.board.resources.find((r) => r.ref.type === 'PLACE' && 'image' in r) as
    | { image: { url: string } | null }
    | undefined;
  const region = detail.board.resources.find((r) => r.ref.type === 'REGION');

  return {
    id: detail.id,
    title: detail.title,
    regionTitle: region && 'title' in region ? region.title : '',
    candidateCount: detail.board.candidates.length,
    thumbnailUrl: firstPlace?.image?.url ?? null,
    savedAt: detail.savedAt,
    updatedAt: detail.savedAt,
  };
}

interface SavedExplorationState {
  details: SavedJourneyDetail[];
  isLoaded: boolean;
  loadSaved: () => Promise<void>;
  saveJourney: (board: JourneyBoard, pinnedRefs: ResourceRef[], title: string) => Promise<SavedJourneyDetail>;
  removeSaved: (id: string) => Promise<void>;
  renameSaved: (id: string, title: string) => void;
  isSaved: (title: string) => boolean;
}

function readLocal(): SavedJourneyDetail[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedJourneyDetail[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: SavedJourneyDetail[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 저장 실패는 화면 동작을 막지 않는다(예: 프라이빗 모드 용량 제한).
  }
}

export const useSavedExplorationStore = create<SavedExplorationState>((set, get) => ({
  details: [],
  isLoaded: false,

  loadSaved: async () => {
    if (!USE_MOCK) {
      try {
        const items = await defaultSavedJourneysRepository.list();
        set({ details: items, isLoaded: true });
        return;
      } catch {
        // 백엔드 실패 — 로컬 저장분으로 폴백한다.
      }
    }
    set({ details: readLocal(), isLoaded: true });
  },

  saveJourney: async (board, pinnedRefs, title) => {
    if (!USE_MOCK) {
      try {
        const detail = await defaultSavedJourneysRepository.create(board, pinnedRefs, title);
        set({ details: [detail, ...get().details] });
        return detail;
      } catch {
        // 백엔드 실패 — 로컬 저장으로 폴백한다.
      }
    }
    const detail: SavedJourneyDetail = {
      id: `saved_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      title,
      savedStateVersion: 1,
      board,
      pinnedRefs,
      savedAt: new Date().toISOString(),
    };
    const next = [detail, ...get().details];
    set({ details: next });
    writeLocal(next);
    return detail;
  },

  removeSaved: async (id) => {
    if (!USE_MOCK) {
      try {
        await defaultSavedJourneysRepository.remove(id);
        set({ details: get().details.filter((d) => d.id !== id) });
        return;
      } catch {
        // 백엔드 실패 — 로컬에서라도 지운다(이전과 동일한 보장).
      }
    }
    const next = get().details.filter((d) => d.id !== id);
    set({ details: next });
    writeLocal(next);
  },

  renameSaved: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const next = get().details.map((d) => (d.id === id ? { ...d, title: trimmed } : d));
    set({ details: next });
    writeLocal(next);
  },

  isSaved: (title) => get().details.some((d) => d.title === title),
}));

export function savedDetailToSummary(detail: SavedJourneyDetail): SavedJourneySummary {
  return toSummary(detail);
}
