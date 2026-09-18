import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';
import { JOURNEY_PLANS, MOOD_OPTIONS } from '../data/curatedJourneys';
import { fetchExplorationBoard } from '../api/explorationApi';

interface EnrichmentBundle {
  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];
}

interface PendingProposal extends EnrichmentBundle {
  board: JourneyBoard;
  keptRefs: ResourceRef[];
  addedRefs: ResourceRef[];
  removedRefs: ResourceRef[];
}

interface JourneyState {
  currentQuery: string;
  /** 아직 아무것도 검색하지 않았으면 null. 무드 칩도 눌리지 않은 상태다. */
  activeMood: MoodId | null;
  /** 한 번이라도 검색했는가. 홈은 검색 전에는 검색창만 보여준다. */
  hasSearched: boolean;
  selectedNodeId: string | null;
  currentPlan: BentoJourneyPlan;
  isGenerating: boolean;

  /** 새 계약(TourAPI + Gemini 실데이터) 보드. KnowledgeGraphView를 대체한 JourneyFlowRail이 그린다. */
  explorationBoard: JourneyBoard | null;
  /** explorationBoard가 확정된 시각. PDF 인쇄에 "생성일"로 쓴다 — 지어내지 않는다. */
  boardCreatedAt: string | null;
  isExploring: boolean;
  /** 고른 장소들에 곁들이는 실데이터 3종 — 공간 기록 / 근처 오디 해설 / 근처 맛집. */
  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];

  /** 고정한 장소. refine 요청에서도 이 장소들은 그대로 유지된다. */
  pinnedRefs: ResourceRef[];
  /** refine 결과 — 적용 전까지는 committed board를 바꾸지 않는다. */
  pendingProposal: PendingProposal | null;
  /** 최근 검색/수정 요청이 실패했을 때 보여줄 메시지. 성공하면 비운다 — 기존 board는 그대로 둔다. */
  lastError: string | null;

  setQuery: (query: string) => void;
  selectMood: (moodId: MoodId) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  submitSearch: (customQuery?: string) => Promise<void>;
  refinePlan: (prompt: string) => Promise<void>;
  togglePin: (ref: ResourceRef) => void;
  applyProposal: () => void;
  dismissProposal: () => void;
  resetJourney: () => void;
  /** 로그인 왕복(카카오) 뒤 sessionStorage에 맡겨뒀던 board나 저장된 여정을 되돌려놓는다. */
  hydrateBoard: (
    board: JourneyBoard,
    pinnedRefs: ResourceRef[],
    enrichment: EnrichmentBundle,
    createdAt?: string,
  ) => void;
}

type SetFn = (partial: Partial<JourneyState>) => void;

/** 최초 검색: explorationBoard를 바로 확정한다 — 비교할 이전 board가 없다. */
async function runInitialExploration(query: string, set: SetFn) {
  set({ isExploring: true });
  const result = await fetchExplorationBoard(query);
  set({
    isExploring: false,
    ...(result.ok
      ? {
          explorationBoard: result.board,
          boardCreatedAt: new Date().toISOString(),
          hanokDogan: result.hanokDogan,
          nearbyAudio: result.nearbyAudio,
          nearbyFood: result.nearbyFood,
          lastError: null,
        }
      : { lastError: result.message }),
  });
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  currentQuery: '',
  activeMood: null,
  hasSearched: false,
  selectedNodeId: null,
  currentPlan: JOURNEY_PLANS.quiet,
  isGenerating: false,
  explorationBoard: null,
  boardCreatedAt: null,
  isExploring: false,
  hanokDogan: [],
  nearbyAudio: [],
  nearbyFood: [],
  pinnedRefs: [],
  pendingProposal: null,
  lastError: null,

  setQuery: (query) => set({ currentQuery: query }),

  selectMood: async (moodId) => {
    const option = MOOD_OPTIONS.find((m) => m.id === moodId);
    const query = option?.query || option?.label || '';
    const fallback = JOURNEY_PLANS[moodId] || JOURNEY_PLANS.quiet;

    set({
      activeMood: moodId,
      currentQuery: query,
      selectedNodeId: null,
      isGenerating: true,
      hasSearched: true,
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
      currentPlan: fallback,
    });

    await runInitialExploration(query, set);
    set({ isGenerating: false });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  submitSearch: async (customQuery) => {
    const query = customQuery ?? get().currentQuery;
    if (!query.trim()) return;

    set({
      isGenerating: true,
      selectedNodeId: null,
      hasSearched: true,
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
    });

    await runInitialExploration(query, set);
    set({ isGenerating: false });
  },

  /**
   * 수정 요청. 고정한 장소(pinnedRefs)는 서버에 그대로 전달돼 반드시 유지되고,
   * 결과는 바로 committed board를 덮지 않고 pendingProposal로 들어간다 — 적용해야 반영된다.
   */
  refinePlan: async (prompt) => {
    if (!prompt.trim()) return;
    const { explorationBoard, pinnedRefs } = get();
    if (!explorationBoard) return;

    set({ isGenerating: true, hasSearched: true, currentQuery: prompt, lastError: null });

    const pinnedPlaces = explorationBoard.resources.filter(
      (r): r is PlaceResource => r.ref.type === 'PLACE' && pinnedRefs.some((p) => p.id === r.ref.id),
    );
    const previousPlaceIds = explorationBoard.candidates.map((c) => c.placeRef.id);
    const previousRegionId = explorationBoard.regionRef.id;

    const result = await fetchExplorationBoard(prompt, { pinnedPlaces, previousPlaceIds, previousRegionId });

    if (result.ok && result.diff) {
      set({
        isGenerating: false,
        pendingProposal: {
          board: result.board,
          hanokDogan: result.hanokDogan,
          nearbyAudio: result.nearbyAudio,
          nearbyFood: result.nearbyFood,
          keptRefs: result.diff.keptRefs,
          addedRefs: result.diff.addedRefs,
          removedRefs: result.diff.removedRefs,
        },
      });
    } else {
      // 실패 — 기존 committed board·pin을 그대로 둔다. 지어내지 않고 이유를 보여준다.
      set({ isGenerating: false, lastError: result.ok ? '변경안을 만들지 못했어요.' : result.message });
    }
  },

  togglePin: (ref) => {
    const { pinnedRefs } = get();
    const exists = pinnedRefs.some((r) => r.id === ref.id);
    set({ pinnedRefs: exists ? pinnedRefs.filter((r) => r.id !== ref.id) : [...pinnedRefs, ref] });
  },

  applyProposal: () => {
    const { pendingProposal } = get();
    if (!pendingProposal) return;
    set({
      explorationBoard: pendingProposal.board,
      boardCreatedAt: new Date().toISOString(),
      hanokDogan: pendingProposal.hanokDogan,
      nearbyAudio: pendingProposal.nearbyAudio,
      nearbyFood: pendingProposal.nearbyFood,
      pendingProposal: null,
    });
  },

  dismissProposal: () => set({ pendingProposal: null }),

  resetJourney: () => {
    set({
      currentQuery: '',
      activeMood: null,
      hasSearched: false,
      selectedNodeId: null,
      isGenerating: false,
      explorationBoard: null,
      boardCreatedAt: null,
      isExploring: false,
      hanokDogan: [],
      nearbyAudio: [],
      nearbyFood: [],
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
    });
  },

  hydrateBoard: (board, pinnedRefs, enrichment, createdAt) => {
    set({
      explorationBoard: board,
      boardCreatedAt: createdAt ?? new Date().toISOString(),
      pinnedRefs,
      hanokDogan: enrichment.hanokDogan,
      nearbyAudio: enrichment.nearbyAudio,
      nearbyFood: enrichment.nearbyFood,
      hasSearched: true,
      pendingProposal: null,
      lastError: null,
    });
  },
}));
