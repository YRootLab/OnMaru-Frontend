import { create } from 'zustand';
import type { JourneyBoard, ResourceRef, SavedJourneyDetail, SavedJourneySummary } from '../types/exploration.types';

/**
 * 새 계약(JourneyBoard)용 저장 여정. seven-day-mvp-fe-handoff.md §11의
 * POST/GET /saved-journeys를 아직 Spring이 제공하지 않아 localStorage로 서 있는 자리다.
 *
 * ponytail: 카카오 로그인이 이제 실제 Kakao 인가 화면까지는 왕복하지만(2026-09-16 기준),
 * 세션 교환은 아직 USE_MOCK 경로다(src/lib/api/client.ts). 그래서 여기도 실제 계정별
 * 서버 저장이 아니라 이 브라우저에 저장한다 — Spring 저장 API가 나오면 이 파일의
 * read/write 두 함수만 실제 fetch로 바꿔 끼우면 된다(기존 useSavedJourneyStore와 동일 패턴).
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
  loadSaved: () => void;
  saveJourney: (board: JourneyBoard, pinnedRefs: ResourceRef[], title: string) => SavedJourneyDetail;
  removeSaved: (id: string) => void;
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

  loadSaved: () => {
    set({ details: readLocal(), isLoaded: true });
  },

  saveJourney: (board, pinnedRefs, title) => {
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

  removeSaved: (id) => {
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
